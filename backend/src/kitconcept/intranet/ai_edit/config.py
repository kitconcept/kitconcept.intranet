"""Configuration for the AI assistant.

Same pattern as the RAG feature of kitconcept.solr
(``kitconcept.solr.rag.config``):

- The feature toggle lives in the Plone registry
  (``kitconcept.intranet.enable_ai_edit``), so an admin can turn the
  assistant on or off.
- The LLM endpoint, credentials and model come from the same environment
  variables as RAG (credentials must not live in the registry).

The endpoint is expected to be a gateway (Open WebUI today) that owns
everything model specific: context length, thinking, sampling, usage.
The assistant only names the model; it sets no limits of its own.
"""

from dataclasses import dataclass
from kitconcept.solr.rag.config import DEFAULT_CHAT_PATH
from kitconcept.solr.rag.config import ENV_CHAT_MODEL
from kitconcept.solr.rag.config import ENV_CHAT_PATH
from kitconcept.solr.rag.config import ENV_TOKEN
from kitconcept.solr.rag.config import ENV_URL
from plone.registry.interfaces import IRegistry
from zope.component import queryUtility

import logging
import os


logger = logging.getLogger("kitconcept.intranet.ai_edit")


REGISTRY_ENABLED_KEY = "kitconcept.intranet.enable_ai_edit"

# The LLM endpoint, token, model and chat path are RAG's variables
# (``ENV_URL``, ``ENV_TOKEN``, ``ENV_CHAT_MODEL``, ``ENV_CHAT_PATH``,
# imported above, one source of truth); the chat model has no default
# here.

# Generous: a turn with a long page takes a while on a local model.
CHAT_TIMEOUT = 120.0

# The gateway's context length in tokens, for the browser's context budget
# (D22). Specific to this feature; must match the model's actual setting
# (``num_ctx``, verified with ``ollama ps``). Without it the browser only
# limits the number of turns.
ENV_CONTEXT_LENGTH = "KITCONCEPT_INTRANET_AI_EDIT_CONTEXT_LENGTH"
# Tokens kept free for reasoning and the answer (default below); set from
# the evals' answers (D22, D57: at most 2,725 tokens over 98 calls, p95
# 2,413; 8000 left no room for a repair on a 39-block page)
ENV_RESERVE_TOKENS = "KITCONCEPT_INTRANET_AI_EDIT_RESERVE_TOKENS"
DEFAULT_RESERVE_TOKENS = 4096
# Seconds one LLM call may take (default CHAT_TIMEOUT). With thinking on a
# local model, a turn took 40-120 s in the first eval and 30 % of the calls
# hit 120 s: size it from measured latencies (each call holds a worker)
ENV_TIMEOUT = "KITCONCEPT_INTRANET_AI_EDIT_TIMEOUT"
# "1" logs every round trip readably at INFO (what the model gets and
# answers) and switches on the browser's console logging: development
# only, the log then holds page content and conversations
ENV_TRACE = "KITCONCEPT_INTRANET_AI_EDIT_TRACE"
# How many requests may wait for the LLM at once per Zope process (default
# below). Each holds a worker thread for the whole call: keep it below the
# process's threads (waitress ``threads`` in zope.ini), so that one is
# always free for the rest of the site
ENV_MAX_CONCURRENT = "KITCONCEPT_INTRANET_AI_EDIT_MAX_CONCURRENT"
DEFAULT_MAX_CONCURRENT = 2
# "0" asks the gateway for the whole answer at once instead of a stream.
# Streaming is the default: a proxy in front of the gateway (Cloudflare:
# about 100 s) ends a request that sends nothing for that long, and a
# page-wide answer takes longer than that (D52)
ENV_STREAM = "KITCONCEPT_INTRANET_AI_EDIT_STREAM"


@dataclass(frozen=True)
class AIEditConfig:
    """Resolved configuration for the AI assistant."""

    base_url: str
    token: str | None
    chat_model: str
    chat_path: str = DEFAULT_CHAT_PATH
    chat_timeout: float = CHAT_TIMEOUT
    context_length: int | None = None
    reserve_tokens: int = DEFAULT_RESERVE_TOKENS
    stream: bool = True


def ai_edit_enabled() -> bool:
    """Is the "AI assistant" registry toggle on?

    Defends against a missing record (e.g. site not upgraded yet).
    """
    registry = queryUtility(IRegistry)
    if registry is None:
        return False
    try:
        return bool(registry[REGISTRY_ENABLED_KEY])
    except KeyError:
        return False


def _env(name: str) -> str:
    return os.environ.get(name, "").strip()


def _env_int(name: str) -> int | None:
    """A positive number from the environment, or None."""
    value = _env(name)
    return int(value) if value.isdigit() and int(value) > 0 else None


def max_concurrent() -> int:
    """How many requests may call the LLM at once in this process."""
    return _env_int(ENV_MAX_CONCURRENT) or DEFAULT_MAX_CONCURRENT


def trace_enabled() -> bool:
    """Is the readable trace of the round trip switched on?"""
    return _env(ENV_TRACE).lower() in ("1", "true", "yes", "on")


_warned = False


def _warn_incomplete(missing: list[str]) -> None:
    """Say once per process why the switched-on assistant stays hidden
    (``@site`` asks on every page load). Unlike RAG, the assistant has no
    default model: ``KITCONCEPT_SOLR_LLM_CHAT_MODEL`` is required."""
    global _warned
    if not _warned:
        _warned = True
        logger.warning(
            "ai-edit: switched on, but not configured: set %s", ", ".join(missing)
        )


def get_ai_edit_config() -> AIEditConfig | None:
    """Return the configuration, or None when the assistant is off.

    The assistant counts as enabled when the registry toggle is on *and* the
    endpoint URL and the model are set.
    """
    if not ai_edit_enabled():
        return None
    base_url = _env(ENV_URL).rstrip("/")
    chat_model = _env(ENV_CHAT_MODEL)
    if not base_url or not chat_model:
        _warn_incomplete([
            n for n, v in ((ENV_URL, base_url), (ENV_CHAT_MODEL, chat_model)) if not v
        ])
        return None
    return AIEditConfig(
        base_url=base_url,
        token=_env(ENV_TOKEN) or None,
        chat_model=chat_model,
        chat_path=_env(ENV_CHAT_PATH) or DEFAULT_CHAT_PATH,
        context_length=_env_int(ENV_CONTEXT_LENGTH),
        reserve_tokens=_env_int(ENV_RESERVE_TOKENS) or DEFAULT_RESERVE_TOKENS,
        chat_timeout=float(_env_int(ENV_TIMEOUT) or CHAT_TIMEOUT),
        stream=_env(ENV_STREAM).lower() not in ("0", "false", "no", "off"),
    )
