"""A readable trace of the round trip (``KITCONCEPT_INTRANET_AI_EDIT_TRACE``).

What the model gets and what it answers, as text: every message with
its line breaks, tool call arguments as indented JSON, the reasoning
when the gateway passes it. The DEBUG log keeps the exact JSON payload
for replaying it.
"""

import json


def _json(value) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, default=repr)


def _arguments(raw) -> str:
    """Tool call arguments, indented when they are JSON."""
    try:
        return _json(json.loads(raw))
    except TypeError, ValueError:
        return str(raw)


def _calls(calls: list[dict]) -> str:
    return "\n".join(
        f"[tool call {call.get('id') or '?'}: "
        f"{(call.get('function') or {}).get('name')}]\n"
        f"{_arguments((call.get('function') or {}).get('arguments'))}"
        for call in calls
    )


def format_messages(messages: list[dict]) -> str:
    """The messages as the model gets them, one section each."""
    sections = []
    for index, message in enumerate(messages):
        head = f"----- {index}: {message.get('role')}"
        if message.get("tool_call_id"):
            head += f" (result of {message['tool_call_id']})"
        body = message.get("content") or ""
        if message.get("tool_calls"):
            body = "\n".join(filter(None, [body, _calls(message["tool_calls"])]))
        sections.append(f"{head} -----\n{body}")
    return "\n".join(sections)


def format_answer(raw: dict) -> str:
    """The gateway's answer: reasoning, text, tool calls, finish reason and
    usage, as far as the response holds them."""
    choices = raw.get("choices") or [{}]
    choice = choices[0] if isinstance(choices[0], dict) else {}
    message = choice.get("message") or {}
    reasoning = message.get("reasoning_content") or message.get("reasoning")
    calls = _calls(message.get("tool_calls") or [])
    parts = [
        "----- reasoning -----\n"
        + (
            reasoning or "(not passed by the gateway; inline <think> shows in the text)"
        ),
        f"----- text -----\n{message.get('content') or '(none)'}",
        f"----- tool calls -----\n{calls or '(none)'}",
        f"----- finish reason: {choice.get('finish_reason')!r}, "
        f"usage: {json.dumps(raw.get('usage') or {}, ensure_ascii=False)}",
    ]
    return "\n".join(parts)


def format_tools(tools: list[dict]) -> str:
    return _json(tools)
