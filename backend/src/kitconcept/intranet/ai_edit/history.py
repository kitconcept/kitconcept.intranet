"""The conversation, in the chat completions message format.

The browser keeps the conversation and sends it with every request, in
the format the model gets it::

    {"role": "user", "content": "..."}
    {"role": "assistant", "content": "...", "tool_calls": [...]}
    {"role": "tool", "tool_call_id": "...", "content": "..."}

Past tool calls go back to the model as structured tool calls, each
followed by its result (what the user applied), so the model sees its
own proposals the way it made them. The browser writes the results (it
knows what was applied); the server validates the structure here.

The history is split into turns: a user message and the answers that
follow. How many turns are sent is up to the browser; model limits are
the gateway's business.
"""

from kitconcept.intranet.ai_edit.tools import normalize_call
from kitconcept.intranet.ai_edit.tools import tool_call


# Result for a tool call the browser sent no result for
MISSING_RESULT = "No result."


def _clean_tool_calls(calls, tool_names: set[str]) -> list[dict]:
    """Keep the well-formed calls of offered tools."""
    cleaned = []
    for call in calls if isinstance(calls, list) else []:
        normalized = normalize_call(call)
        if normalized is None:
            continue
        call_id, name, arguments = normalized
        # A call in the history needs its id: its result refers to it
        if call_id and name in tool_names:
            cleaned.append(tool_call(call_id, name, arguments))
    return cleaned


def _pair_results(turn: list[dict]) -> list[dict]:
    """Put exactly one result right after each tool call."""
    results = {m["tool_call_id"]: m for m in turn if m["role"] == "tool"}
    paired = []
    for message in turn:
        if message["role"] == "tool":
            continue
        paired.append(message)
        for call in message.get("tool_calls", []):
            paired.append(
                results.get(call["id"])
                or {
                    "role": "tool",
                    "tool_call_id": call["id"],
                    "content": MISSING_RESULT,
                }
            )
    return paired


def clean_history(messages: list, tool_names: set[str]) -> list[list[dict]]:
    """Validate the conversation and split it into turns.

    Unknown roles, malformed tool calls and results without a call are
    dropped. Messages before the first user message are ignored.
    """
    turns: list[list[dict]] = []
    for m in messages:
        if not isinstance(m, dict):
            continue
        role = m.get("role")
        content = str(m.get("content") or "")
        if role == "user":
            turns.append([{"role": "user", "content": content}])
        elif not turns:
            continue
        elif role == "assistant":
            message = {"role": "assistant", "content": content}
            if calls := _clean_tool_calls(m.get("tool_calls"), tool_names):
                message["tool_calls"] = calls
            turns[-1].append(message)
        elif role == "tool":
            turns[-1].append({
                "role": "tool",
                "tool_call_id": str(m.get("tool_call_id") or ""),
                "content": content,
            })
    return [_pair_results(turn) for turn in turns]
