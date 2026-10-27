"""AI-assisted editing: ``@ai-edit`` (spec §4, §5, AI_WORKFLOW.md).

A permissioned proxy to the LLM gateway with a fixed prompt and tool, so
the endpoint is not a general-purpose LLM proxy. The browser's harness
does everything else: it projects the live form into the page, validates
the model's operations, asks for one repair, shows the diffs and applies
what the editor selects. The server reads and writes no content.

``POST <context>/@ai-edit``, from the edit form (on the content) and from
the add form (on the folder the content is added to). ``GET`` tells the
panel, before the first question, whether the user may use the assistant
there, and the values of the browser's context budget. Both need the
``kitconcept.intranet: Use AI editing`` permission (``permissions.zcml``,
``rolemap.xml``); it gates who may use the LLM, not access to content.

Request::

    {
      "language": "de",
      "messages": [chat completions messages, see ai_edit.history],
      "page": {...},          # see ai_edit.page
      "block_types": {...},   # see ai_edit.page
      "repair": false         # the repair call (D8): ends with a tool result
    }

Response::

    {"message": "...", "tool_calls": [...], "finish_reason": "stop",
     "usage": {"prompt_tokens": 0, "completion_tokens": 0,
               "reasoning_tokens": null, "reasoning": false,
               "input_truncated": false},
     "reasoning": "...", "error": null, "error_code": null}

``tool_calls`` are the model's calls as they came (ids added); the
harness reads and validates them. Errors of the assistant (not
configured, too large, busy, LLM timed out or failed) are answered with
status 200 and
an ``error_code``, like ``@rag-search`` of kitconcept.solr; only malformed
requests get a 400.
"""

from datetime import date
from kitconcept.intranet.ai_edit import propose_changes
from kitconcept.intranet.ai_edit import trace
from kitconcept.intranet.ai_edit.client import AIEditClient
from kitconcept.intranet.ai_edit.client import AIEditClientError
from kitconcept.intranet.ai_edit.client import AIEditTimeout
from kitconcept.intranet.ai_edit.config import get_ai_edit_config
from kitconcept.intranet.ai_edit.config import max_concurrent
from kitconcept.intranet.ai_edit.config import trace_enabled
from kitconcept.intranet.ai_edit.history import clean_history
from kitconcept.intranet.ai_edit.page import clean_block_types
from kitconcept.intranet.ai_edit.page import clean_page
from kitconcept.intranet.ai_edit.page import count_blocks
from kitconcept.intranet.ai_edit.prompt import STRUCTURAL_TAGS
from kitconcept.intranet.ai_edit.prompt import base_prompt
from kitconcept.intranet.ai_edit.prompt import build_system_message
from kitconcept.intranet.ai_edit.prompt import language_name
from kitconcept.intranet.ai_edit.rules import CATEGORIES
from kitconcept.intranet.ai_edit.rules import OPS
from kitconcept.intranet.ai_edit.tools import with_ids
from plone.restapi.deserializer import json_body
from plone.restapi.exceptions import DeserializationError
from plone.restapi.services import Service
from zExceptions import BadRequest

import json
import logging
import threading
import time


logger = logging.getLogger("kitconcept.intranet.ai_edit")

# Each request holds a Zope worker thread for the whole LLM call (up to
# the chat timeout). Limit how many run at once per instance so editors
# using the assistant cannot occupy all workers; further requests get a
# "busy" answer right away. This protects Plone, which no gateway can.
# Set per process (KITCONCEPT_INTRANET_AI_EDIT_MAX_CONCURRENT, read at
# startup): below the process's worker threads
MAX_CONCURRENT_REQUESTS = max_concurrent()
_slots = threading.BoundedSemaphore(MAX_CONCURRENT_REQUESTS)

# Guard against abuse of the endpoint, not a token budget (the browser
# keeps the context budget, D22). Checked on the raw body, before parsing.
MAX_REQUEST_BYTES = 400_000


ERROR_NOT_CONFIGURED = "not_configured"
ERROR_REQUEST_TOO_LARGE = "request_too_large"
ERROR_LLM_FAILED = "llm_failed"
# Kept apart from other failures: a slow model is fixed differently
# (timeout, context size) than an unreachable or refusing gateway
ERROR_LLM_TIMEOUT = "llm_timeout"
ERROR_BUSY = "busy"


# The one tool and how to call it (D58: the intent toolset of D57 is
# gone, AI_EDIT_INTENT_TOOLSET.md); its calls are the only ones a history
# keeps
TOOLS = propose_changes.TOOLS
INSTRUCTIONS = propose_changes.INSTRUCTIONS
TOOL_NAMES = {propose_changes.NAME}


def fixed_prompt_chars() -> int:
    """The size of what every request sends besides page and history: the
    base rules, the tool's rules and its definition (for the budget)."""
    return (
        len(base_prompt("English", date.today().isoformat()))
        + len(INSTRUCTIONS)
        + len(json.dumps(TOOLS))
    )


def _result(
    message="",
    tool_calls=None,
    finish_reason="",
    usage=None,
    error=None,
    error_code=None,
    reasoning="",
) -> dict:
    return {
        "message": message,
        "tool_calls": tool_calls or [],
        "finish_reason": finish_reason,
        "usage": usage or {},
        # The model's reasoning when the gateway passes it: for the eval
        # and debugging, never part of the conversation
        "reasoning": reasoning,
        "error": error,
        "error_code": error_code,
    }


# Characters per token no real prompt exceeds (English prose with markup
# is about 4): fewer reported tokens than this allows means the gateway
# cut the input, e.g. Ollama with a 2048-token context dropping the
# start of the system prompt without an error
MAX_CHARS_PER_TOKEN = 6


def _prompt_chars(messages: list[dict], tools: list) -> int:
    """The size of what the model was sent: messages, tool calls, tools."""
    return len(json.dumps(tools)) + sum(
        len(message.get("content") or "")
        + len(json.dumps(message.get("tool_calls") or ""))
        for message in messages
    )


def _usage(answer, messages: list[dict], tools: list) -> dict:
    usage = answer.raw.get("usage") or {}
    details = usage.get("completion_tokens_details") or {}
    prompt_tokens = usage.get("prompt_tokens")
    expected = _prompt_chars(messages, tools) // MAX_CHARS_PER_TOKEN
    return {
        "prompt_tokens": prompt_tokens,
        "completion_tokens": usage.get("completion_tokens"),
        "reasoning_tokens": details.get("reasoning_tokens"),
        "reasoning": answer.reasoning or bool(details.get("reasoning_tokens")),
        # The model saw only part of the request (the gateway's context is
        # too small): the answer is not the model's quality
        "input_truncated": isinstance(prompt_tokens, int)
        and 0 < prompt_tokens < expected,
    }


# The schema is fixed: the trace shows it once per process
_tools_traced = False


def _trace_request(path: str, repair: bool, messages: list[dict]) -> None:
    """With the trace on: what the model gets, readably (spec §4)."""
    global _tools_traced
    if not trace_enabled():
        return
    if not _tools_traced:
        _tools_traced = True
        logger.info(
            "ai-edit trace: tools offered (once per process):\n%s",
            trace.format_tools(TOOLS),
        )
    logger.info(
        "ai-edit trace: %srequest to the LLM for %s, %d messages\n%s",
        "REPAIR " if repair else "",
        path,
        len(messages),
        trace.format_messages(messages),
    )


def _shape(raw: dict) -> dict:
    """What a response held, without its content (no page text or model
    output in a log that is on in production): the finish reason, the
    message's keys with the length of each, and the usage."""
    choices = raw.get("choices") if isinstance(raw, dict) else None
    choice = choices[0] if isinstance(choices, list) and choices else {}
    message = choice.get("message") if isinstance(choice, dict) else None
    return {
        "finish_reason": choice.get("finish_reason")
        if isinstance(choice, dict)
        else None,
        "message": {
            key: len(value) if isinstance(value, (str, list, dict)) else value
            for key, value in message.items()
        }
        if isinstance(message, dict)
        else None,
        "usage": raw.get("usage") if isinstance(raw, dict) else None,
    }


def _debug(step: str, data) -> None:
    """Log one step of the round trip in full, at debug level (it contains
    page content and the conversation)."""
    if logger.isEnabledFor(logging.DEBUG):
        logger.debug(
            "ai-edit %s:\n%s",
            step,
            json.dumps(data, ensure_ascii=False, indent=2, default=repr),
        )


def _body(request) -> dict:
    try:
        return json_body(request)
    except DeserializationError as e:
        # Not a JSON object: a client error, not a 500
        raise BadRequest(str(e)) from e


def _clean_messages(messages, repair: bool) -> list[dict]:
    """The conversation: it ends with the user's request, or for a repair
    call with the tool result listing the failed operations. Calls of
    other tools are dropped."""
    if not isinstance(messages, list):
        raise BadRequest("messages must be a list")
    turns = clean_history(messages, TOOL_NAMES)
    if not turns:
        raise BadRequest("The conversation must start with a user message")
    last = turns[-1][-1]
    if repair and last["role"] != "tool":
        raise BadRequest("A repair call must end with a tool result")
    if not repair and (len(turns[-1]) != 1 or last["role"] != "user"):
        raise BadRequest("The last message must be a user message")
    return [message for turn in turns for message in turn]


class AIEditGet(Service):
    """May the current user use the assistant here, and is it configured?

    The permission is checked by the publisher, as for the POST: a user
    without it gets a 401 before this runs, which the panel shows as a
    clear message. Whether the assistant is switched on comes from
    ``@site`` too; this also covers a change after the page was loaded.
    The budget values let the browser keep requests inside the gateway's
    context (D22); the operations, categories and the prompt's structural
    tags are the ones the browser validates against and unescapes.
    """

    def reply(self):
        config = get_ai_edit_config()
        if config is None:
            return {"available": False, "error_code": ERROR_NOT_CONFIGURED}
        return {
            "available": True,
            "error_code": None,
            "context_length": config.context_length,
            "reserve_tokens": config.reserve_tokens,
            "fixed_prompt_chars": fixed_prompt_chars(),
            # The browser logs its side of the round trip too
            "trace": trace_enabled(),
            # The vocabulary the prompt and the tool schema use: the
            # browser validates against it (one source of truth)
            "operations": OPS,
            "categories": CATEGORIES,
            "structural_tags": sorted(STRUCTURAL_TAGS),
        }


class AIEditPost(Service):
    """One LLM call for the page being edited or added."""

    def reply(self):
        if len(self.request.get("BODY") or b"") > MAX_REQUEST_BYTES:
            return _result(
                error="Request too large",
                error_code=ERROR_REQUEST_TOO_LARGE,
            )
        data = _body(self.request)
        _debug("request from the browser", data)
        result = self._reply(data)
        _debug("response to the browser", result)
        return result

    def _reply(self, data: dict) -> dict:
        page = clean_page(data.get("page"))
        if page is None:
            raise BadRequest("Missing page")
        block_types = clean_block_types(data.get("block_types"))
        repair = data.get("repair") is True
        history = _clean_messages(data.get("messages"), repair)
        config = get_ai_edit_config()

        if config is None:
            return _result(
                error="The AI assistant is not configured",
                error_code=ERROR_NOT_CONFIGURED,
            )

        system = build_system_message(
            page,
            block_types,
            INSTRUCTIONS,
            language=language_name(data.get("language")),
            today=date.today().isoformat(),
        )
        messages = [system, *history]
        # The types this request may insert, as the schema's values (D59)
        tools = propose_changes.tools_for(
            sorted(name for name, entry in block_types.items() if entry["insertable"])
        )
        # The exact payload (without "stream"), to replay it with curl
        _debug(
            "request to the LLM",
            {"model": config.chat_model, "messages": messages, "tools": tools},
        )
        path = "/".join(self.context.getPhysicalPath())
        _trace_request(path, repair, messages)
        # Acquired right before the try, so that nothing can fail between
        # acquiring and releasing the slot (a leaked slot means "busy"
        # until restart)
        if not _slots.acquire(blocking=False):
            return _result(
                error="The AI assistant is busy, please try again in a moment",
                error_code=ERROR_BUSY,
            )
        started = time.monotonic()
        try:
            answer = AIEditClient(config).chat(messages, tools)
        except AIEditClientError as e:
            # Details (LLM host, upstream response) only go to the log
            logger.warning("ai-edit: %s", e)
            return _result(
                error="The AI assistant could not answer",
                error_code=(
                    ERROR_LLM_TIMEOUT
                    if isinstance(e, AIEditTimeout)
                    else ERROR_LLM_FAILED
                ),
            )
        finally:
            _slots.release()
        _debug("answer of the LLM (raw)", answer.raw)
        if trace_enabled():
            logger.info(
                "ai-edit trace: answer of the LLM after %.1fs\n%s",
                time.monotonic() - started,
                trace.format_answer(answer.raw),
            )

        usage = _usage(answer, messages, tools)
        if usage["input_truncated"]:
            logger.error(
                "ai-edit: the gateway cut the input: %s prompt tokens reported "
                "for about %d characters (at least %d tokens). Raise the "
                "model's context length (Ollama num_ctx) above the largest "
                "request.",
                usage["prompt_tokens"],
                _prompt_chars(messages, tools),
                _prompt_chars(messages, tools) // MAX_CHARS_PER_TOKEN,
            )
        logger.info(
            "ai-edit: %s, %s%d blocks, %d messages, %.1fs, "
            "finish_reason=%r, "
            "%s prompt tokens, %s completion tokens, %s reasoning tokens, "
            "reasoning=%s, %d chars of text, %d tool calls",
            path,
            "repair, " if repair else "",
            count_blocks(page["blocks"]),
            len(history),
            time.monotonic() - started,
            answer.finish_reason,
            usage["prompt_tokens"],
            usage["completion_tokens"],
            usage["reasoning_tokens"],
            usage["reasoning"],
            len(answer.content),
            len(answer.tool_calls),
        )
        if not answer.content and not answer.tool_calls:
            # The model produced something (see completion tokens) that
            # did not reach us as text or tool call: what the gateway sent,
            # at any log level, by its shape only; the raw response (model
            # output) at DEBUG, above
            logger.warning(
                "ai-edit: empty answer, the gateway's response: %s",
                json.dumps(_shape(answer.raw)),
            )
        return _result(
            message=answer.content,
            tool_calls=with_ids(answer.tool_calls),
            finish_reason=answer.finish_reason,
            usage=usage,
            reasoning=answer.reasoning_text,
        )
