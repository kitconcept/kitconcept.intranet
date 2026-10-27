"""Tool calls in the chat completions format.

Used for the model's answer and for the history the browser sends. The
assistant offers one tool, ``propose_changes`` (see ``propose_changes``);
tool calls are never executed on the server, a tool call is a proposal.
"""

import json
import uuid


def normalize_call(call) -> tuple[str | None, str, dict] | None:
    """A tool call as ``(id, name, arguments)``.

    Tool arguments arrive as a JSON string or as an object. Returns None
    for a malformed call (no function object, no name, arguments that
    are not a JSON object, typically an answer cut off in the middle of
    the JSON); ``id`` is None when the call has none.
    """
    function = call.get("function") if isinstance(call, dict) else None
    if not isinstance(function, dict) or not isinstance(function.get("name"), str):
        return None
    arguments = function.get("arguments")
    if isinstance(arguments, str):
        try:
            arguments = json.loads(arguments)
        except ValueError:
            return None
    if not isinstance(arguments, dict):
        return None
    call_id = call.get("id")
    if not isinstance(call_id, str) or not call_id:
        call_id = None
    return call_id, function["name"], arguments


def tool_call(call_id: str, name: str, arguments: dict) -> dict:
    """A tool call in the chat completions format."""
    return {
        "id": call_id,
        "type": "function",
        # Non-ASCII as it is: escapes would cost the model tokens and the
        # browser's budget (JSON.stringify) would undercount them
        "function": {
            "name": name,
            "arguments": json.dumps(arguments, ensure_ascii=False),
        },
    }


def with_ids(tool_calls) -> list[dict]:
    """The model's tool calls as they came, each with an id (not every
    server sets one; the history needs them). Reading and validating them
    is the browser's harness's job, malformed ones included: it reports
    them to the model in the repair call."""
    return [
        {**call, "id": call.get("id") or f"call_{uuid.uuid4().hex[:12]}"}
        for call in tool_calls or []
        if isinstance(call, dict)
    ]
