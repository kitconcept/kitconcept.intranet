"""The readable trace of the round trip."""

from kitconcept.intranet.ai_edit import trace

import json


def test_format_messages():
    """Every message as a section, line breaks kept, tool calls indented."""
    text = trace.format_messages([
        {"role": "system", "content": "Rules:\n- one"},
        {"role": "user", "content": "Selected: b2\n\nFix it"},
        {
            "role": "assistant",
            "content": "Done.",
            "tool_calls": [
                {
                    "id": "call_1",
                    "function": {
                        "name": "propose_changes",
                        "arguments": json.dumps({"operations": []}),
                    },
                }
            ],
        },
        {"role": "tool", "tool_call_id": "call_1", "content": "Applied: b2."},
    ])
    assert text == (
        "----- 0: system -----\nRules:\n- one\n"
        "----- 1: user -----\nSelected: b2\n\nFix it\n"
        "----- 2: assistant -----\nDone.\n"
        '[tool call call_1: propose_changes]\n{\n  "operations": []\n}\n'
        "----- 3: tool (result of call_1) -----\nApplied: b2."
    )


def test_format_answer():
    """Reasoning, text, tool calls (unreadable arguments as they came)."""
    text = trace.format_answer({
        "choices": [
            {
                "message": {
                    "content": "",
                    "reasoning_content": "The title has a typo.",
                    "tool_calls": [
                        {"id": "c", "function": {"name": "x", "arguments": "{"}}
                    ],
                },
                "finish_reason": "tool_calls",
            }
        ],
        "usage": {"prompt_tokens": 10},
    })
    assert "----- reasoning -----\nThe title has a typo." in text
    assert "----- text -----\n(none)" in text
    assert "[tool call c: x]\n{" in text
    assert "finish reason: 'tool_calls'" in text
    assert '"prompt_tokens": 10' in text


def test_format_answer_without_reasoning():
    text = trace.format_answer({})
    assert "(not passed by the gateway" in text
    assert "----- tool calls -----\n(none)" in text
