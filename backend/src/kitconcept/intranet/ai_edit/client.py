"""HTTP client for the chat completions endpoint of the LLM gateway.

Only ``model``, ``messages``, ``tools`` and ``stream`` are sent: model
settings (context length, thinking, sampling) belong to the gateway.
With Open WebUI, sending ``chat_id``/``id`` or ``tool_ids`` would make
it run tools itself instead of handing the ``tool_calls`` back.

The answer is streamed by default (D52): a proxy in front of the gateway
ends a request that sends nothing for about 100 s, and a page-wide answer
takes longer. The chunks are put back together into the shape of a
non-streamed response, so everything after the client reads one shape.
"""

from dataclasses import dataclass
from dataclasses import field
from kitconcept.intranet.ai_edit.config import AIEditConfig

import json
import re
import requests
import time


# Safety net for a gateway that passes reasoning through in the content,
# also when the answer was cut off before the closing tag
THINK_RE = re.compile(r"<think>(.*?)(?:</think>|$)", re.DOTALL)


class AIEditClientError(Exception):
    """Error talking to the LLM gateway."""


class AIEditTimeout(AIEditClientError):
    """The gateway did not answer within the timeout."""


@dataclass(frozen=True)
class ChatResult:
    # The text answer
    content: str
    tool_calls: list[dict]
    # "length" means the answer was cut off
    finish_reason: str
    # Whether the model reasoned (thinking), as far as the gateway shows it
    reasoning: bool = False
    # The reasoning itself, when the gateway passes it (for the eval and
    # debugging; it never enters the conversation)
    reasoning_text: str = ""
    # The gateway's response as it arrived, for the logs only
    raw: dict = field(default_factory=dict, repr=False, compare=False)


class AIEditClient:
    def __init__(self, config: AIEditConfig):
        self.config = config

    def chat(self, messages: list[dict], tools: list[dict]) -> ChatResult:
        """Run one chat completion."""
        url = f"{self.config.base_url}{self.config.chat_path}"
        headers = {}
        if self.config.token:
            headers["Authorization"] = f"Bearer {self.config.token}"
        payload = {
            "model": self.config.chat_model,
            "messages": messages,
            "tools": tools,
            "stream": self.config.stream,
        }
        timeout = self.config.chat_timeout
        deadline = time.monotonic() + timeout
        try:
            with requests.post(
                url,
                json=payload,
                headers=headers,
                timeout=timeout,
                # Always read as it comes, so the deadline bounds the whole
                # answer, streamed or not (a code review: a slow JSON body
                # held the worker past the timeout)
                stream=True,
            ) as response:
                if response.status_code != 200:
                    # Also the gateway's own limits, e.g. a context length
                    # exceeded
                    raise AIEditClientError(
                        f"LLM gateway returned {response.status_code}: "
                        f"{response.text[:200]}"
                    )
                streamed = self.config.stream and "event-stream" in (
                    response.headers.get("Content-Type") or ""
                )
                data = (
                    _assembled(response.iter_lines(), deadline, timeout)
                    if streamed
                    else json.loads(_whole(response, deadline, timeout))
                )
        except requests.Timeout as e:
            raise AIEditTimeout(f"timeout after {timeout}s") from e
        except requests.ConnectionError as e:
            # A chunk that does not come in time, in the middle of a stream
            if "timed out" in str(e):
                raise AIEditTimeout(f"timeout after {timeout}s") from e
            raise AIEditClientError(f"request failed: {e}") from e
        except requests.RequestException as e:
            raise AIEditClientError(f"request failed: {e}") from e
        except (ValueError, TypeError, AttributeError, KeyError, IndexError) as e:
            # A malformed answer is the gateway's failure (llm_failed), not
            # an error of this service (D57, a code review: HTTP 500)
            raise AIEditClientError("unexpected response shape") from e
        return _result(data)


def _result(data: dict) -> ChatResult:
    """The answer of a response, non-streamed or assembled."""
    try:
        choice = data["choices"][0]
        message = choice["message"]
        content = message.get("content") or ""
        inline = THINK_RE.search(content)
        reasoning_text = (
            message.get("reasoning_content")
            or message.get("reasoning")
            or (inline.group(1) if inline else "")
        )
        return ChatResult(
            # Reasoning passed through inline never enters the history
            content=THINK_RE.sub("", content).strip(),
            tool_calls=message.get("tool_calls") or [],
            finish_reason=choice.get("finish_reason") or "",
            reasoning=bool(reasoning_text or inline),
            reasoning_text=reasoning_text.strip()
            if isinstance(reasoning_text, str)
            else "",
            raw=data,
        )
    except (ValueError, KeyError, IndexError, TypeError, AttributeError) as e:
        raise AIEditClientError("unexpected response shape") from e


def _text(value) -> str | None:
    return value if isinstance(value, str) and value else None


def _target(calls: list[dict], slots: dict, call_id, name, index) -> int:
    """Where a tool call piece goes: the call of its id, else of its
    index unless it announces another call there, else the last call for
    a bare piece, else a new call."""
    for position, call in enumerate(calls):
        if call_id and call.get("id") == call_id:
            return position
    if index is not None and index in slots:
        slot = calls[slots[index]]
        other = (call_id and slot.get("id") and slot["id"] != call_id) or (
            name and slot["function"].get("name")
        )
        if not other:
            return slots[index]
    if not call_id and not name and calls:
        return len(calls) - 1
    calls.append({"type": "function", "function": {"arguments": ""}})
    return len(calls) - 1


def _merge_tool_calls(calls: list[dict], slots: dict, deltas) -> None:
    """Add the tool call pieces of one chunk.

    A call is announced once (its id and name) and its arguments may
    arrive in pieces. A piece belongs to the call it names by id, else to
    the call of its ``index`` (``slots``: the gateway's index -> our
    position); a piece that announces a call where another one already
    is starts a new call: a gateway may send each parallel call in its
    own chunk with the same index, or none (D57, a code review: merged,
    they became one unreadable call). A piece without index, id or name
    continues the last call.
    """
    for delta in deltas if isinstance(deltas, list) else []:
        if not isinstance(delta, dict):
            continue
        function = delta.get("function")
        function = function if isinstance(function, dict) else {}
        call_id = _text(delta.get("id"))
        name = _text(function.get("name"))
        index = delta.get("index")
        index = index if type(index) is int else None
        target = _target(calls, slots, call_id, name, index)
        if index is not None:
            slots[index] = target
        call = calls[target]
        if call_id:
            call["id"] = call_id
        if name:
            call["function"]["name"] = name
        arguments = function.get("arguments")
        if isinstance(arguments, dict):
            # Some gateways pass them parsed
            arguments = json.dumps(arguments, ensure_ascii=False)
        if isinstance(arguments, str):
            call["function"]["arguments"] += arguments


def _chunk(line) -> dict | None:
    """One server-sent event's data as an object; None for other lines
    and the end marker."""
    # Bytes: the stream's charset is often not declared
    line = line.decode("utf-8") if isinstance(line, bytes) else line
    if not line.startswith("data:"):
        return None
    body = line[len("data:") :].strip()
    if body == "[DONE]":
        return {"done": True}
    chunk = json.loads(body)
    if not isinstance(chunk, dict):
        # Not the 200 + error_code a caller handles: a shape error
        raise AIEditClientError("unexpected stream chunk")
    if chunk.get("error"):
        raise AIEditClientError(f"LLM gateway error: {str(chunk['error'])[:200]}")
    return chunk


def _deltas(chunk: dict) -> list[tuple[dict, dict]]:
    """The chunk's choices with their deltas, malformed ones left out."""
    choices = chunk.get("choices")
    return [
        (choice, choice["delta"] if isinstance(choice.get("delta"), dict) else {})
        for choice in (choices if isinstance(choices, list) else [])
        if isinstance(choice, dict)
    ]


def _whole(response, deadline: float, timeout: float) -> bytes:
    """A non-streamed body, read within the deadline (``requests``'
    timeout only bounds the wait for each piece)."""
    pieces = []
    for piece in response.iter_content(chunk_size=65536):
        if time.monotonic() > deadline:
            raise AIEditTimeout(f"timeout after {timeout}s")
        pieces.append(piece)
    return b"".join(pieces)


def _assembled(lines, deadline: float, timeout: float) -> dict:
    """A streamed answer (server-sent events) as one non-streamed response.

    ``requests``' timeout only bounds the wait for each chunk; the
    deadline bounds the whole answer.
    """
    content: list[str] = []
    reasoning: list[str] = []
    calls: list[dict] = []
    slots: dict = {}
    finish_reason = ""
    usage = None
    for raw_line in lines:
        if time.monotonic() > deadline:
            raise AIEditTimeout(f"timeout after {timeout}s")
        chunk = _chunk(raw_line)
        if chunk is None:
            continue
        if chunk.get("done"):
            break
        if isinstance(chunk.get("usage"), dict):
            usage = chunk["usage"]
        for choice, delta in _deltas(chunk):
            content.append(_text(delta.get("content")) or "")
            reasoning.append(
                _text(delta.get("reasoning_content"))
                or _text(delta.get("reasoning"))
                or ""
            )
            _merge_tool_calls(calls, slots, delta.get("tool_calls"))
            finish_reason = _text(choice.get("finish_reason")) or finish_reason
    message = {"role": "assistant", "content": "".join(content)}
    if any(reasoning):
        message["reasoning_content"] = "".join(reasoning)
    if calls:
        message["tool_calls"] = calls
    data = {"choices": [{"message": message, "finish_reason": finish_reason}]}
    if usage:
        data["usage"] = usage
    return data
