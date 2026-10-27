from kitconcept.intranet.ai_edit.history import MISSING_RESULT
from kitconcept.intranet.ai_edit.history import clean_history

import json


TOOLS = {"propose_changes"}


def call(call_id, name="propose_changes", arguments="{}"):
    return {"id": call_id, "function": {"name": name, "arguments": arguments}}


def test_clean_history_keeps_valid_calls_only():
    messages = [
        {"role": "user", "content": "Improve"},
        {
            "role": "assistant",
            "content": "",
            "tool_calls": [
                call("call_1", arguments={"title": "New"}),
                # No id: its result could not refer to it
                call(""),
                call("call_3", name="other_tool"),
                call("call_4", arguments='{"title": '),
                {"id": "call_5", "function": "propose_changes"},
            ],
        },
        {"role": "tool", "tool_call_id": "call_1", "content": "applied"},
    ]
    [turn] = clean_history(messages, TOOLS)
    assert turn == [
        {"role": "user", "content": "Improve"},
        {
            "role": "assistant",
            "content": "",
            "tool_calls": [
                {
                    "id": "call_1",
                    "type": "function",
                    "function": {
                        "name": "propose_changes",
                        "arguments": json.dumps({"title": "New"}),
                    },
                }
            ],
        },
        {"role": "tool", "tool_call_id": "call_1", "content": "applied"},
    ]


def test_clean_history_adds_missing_results():
    messages = [
        {"role": "user", "content": "Improve"},
        {"role": "assistant", "content": "", "tool_calls": [call("call_1")]},
        {"role": "user", "content": "Again"},
    ]
    turns = clean_history(messages, TOOLS)
    assert turns[0][-1] == {
        "role": "tool",
        "tool_call_id": "call_1",
        "content": MISSING_RESULT,
    }
    assert turns[1] == [{"role": "user", "content": "Again"}]


def test_history_keeps_non_ascii():
    """Escapes like \\u00fc cost the model tokens and the browser's budget
    would undercount them."""
    from kitconcept.intranet.ai_edit.tools import tool_call

    call = tool_call("call_1", "propose_changes", {"value": "Grüße"})
    assert call["function"]["arguments"] == '{"value": "Grüße"}'
