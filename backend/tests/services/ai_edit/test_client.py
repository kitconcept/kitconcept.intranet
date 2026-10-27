"""Reading the gateway's answer: text, tool calls and the reasoning,
non-streamed and streamed (D52)."""

from kitconcept.intranet.ai_edit import client as client_module
from kitconcept.intranet.ai_edit.client import AIEditClient
from kitconcept.intranet.ai_edit.client import AIEditTimeout
from kitconcept.intranet.ai_edit.config import AIEditConfig

import json
import pytest


class Response:
    status_code = 200

    def __init__(self, message=None, chunks=None):
        self.chunks = chunks
        self.headers = {
            "Content-Type": "text/event-stream" if chunks else "application/json"
        }
        self.data = {"choices": [{"message": message, "finish_reason": "stop"}]}

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def iter_content(self, chunk_size=1):
        yield json.dumps(self.data).encode()

    def iter_lines(self):
        for chunk in self.chunks:
            yield f"data: {json.dumps(chunk)}".encode()
            yield b""
        yield b"data: [DONE]"


def _client(monkeypatch, response, stream=True):
    sent = {}

    def post(url, **kwargs):
        sent.update(kwargs)
        return response

    monkeypatch.setattr(client_module.requests, "post", post)
    config = AIEditConfig(
        base_url="http://llm.invalid", token=None, chat_model="m", stream=stream
    )
    return AIEditClient(config), sent


@pytest.fixture
def chat(monkeypatch):
    def answer(message):
        client, _ = _client(monkeypatch, Response(message), stream=False)
        return client.chat([], [])

    return answer


def test_reasoning_from_the_gateway(chat):
    result = chat({"content": "Done.", "reasoning_content": " Checking b8. "})
    assert result.content == "Done."
    assert result.reasoning is True
    assert result.reasoning_text == "Checking b8."


def test_reasoning_inline_is_kept_out_of_the_text(chat):
    result = chat({"content": "<think>Checking b8.</think>Done."})
    assert result.content == "Done."
    assert result.reasoning_text == "Checking b8."


def test_no_reasoning(chat):
    result = chat({"content": "Done."})
    assert result.reasoning is False
    assert result.reasoning_text == ""


def _delta(delta, finish_reason=None):
    return {"choices": [{"delta": delta, "finish_reason": finish_reason}]}


def test_a_streamed_answer_is_put_back_together(monkeypatch):
    chunks = [
        _delta({"reasoning_content": "Checking "}),
        _delta({"reasoning_content": "b8."}),
        _delta({"content": "Grüße, "}),
        _delta({
            "tool_calls": [
                {
                    "index": 0,
                    "id": "call_1",
                    "function": {"name": "propose_changes", "arguments": '{"mes'},
                }
            ]
        }),
        _delta({"tool_calls": [{"index": 0, "function": {"arguments": 'sage": 1}'}}]}),
        _delta({"content": "done."}, finish_reason="tool_calls"),
        {"choices": [], "usage": {"prompt_tokens": 10, "completion_tokens": 5}},
    ]
    client, sent = _client(monkeypatch, Response(chunks=chunks))
    result = client.chat([], [])
    assert sent["stream"] is True
    assert sent["json"]["stream"] is True
    assert result.content == "Grüße, done."
    assert result.reasoning_text == "Checking b8."
    assert result.finish_reason == "tool_calls"
    assert result.tool_calls == [
        {
            "type": "function",
            "id": "call_1",
            "function": {"name": "propose_changes", "arguments": '{"message": 1}'},
        }
    ]
    assert result.raw["usage"] == {"prompt_tokens": 10, "completion_tokens": 5}


def test_a_stream_past_the_timeout_ends(monkeypatch):
    client, _ = _client(monkeypatch, Response(chunks=[_delta({"content": "a"})]))
    clock = iter([0.0, 1000.0])
    monkeypatch.setattr(client_module.time, "monotonic", lambda: next(clock))
    with pytest.raises(AIEditTimeout):
        client.chat([], [])


def test_a_whole_answer_past_the_timeout_ends(monkeypatch):
    """Not streamed, the deadline bounds the body too (a code review)."""
    client, _ = _client(monkeypatch, Response({"content": "a"}), stream=False)
    clock = iter([0.0, 1000.0])
    monkeypatch.setattr(client_module.time, "monotonic", lambda: next(clock))
    with pytest.raises(AIEditTimeout):
        client.chat([], [])


def test_a_gateway_that_does_not_stream_is_read_whole(monkeypatch):
    # Asked for a stream, answered with JSON
    client, _ = _client(monkeypatch, Response({"content": "Done."}))
    assert client.chat([], []).content == "Done."


def _call(call_id, name, arguments, **more):
    return {"id": call_id, "function": {"name": name, "arguments": arguments}, **more}


@pytest.mark.parametrize(
    "first, second",
    [
        # Each parallel call in its own chunk, all with index 0
        (
            _call("a", "delete_block", '{"ref": "b1"}', index=0),
            _call("b", "delete_block", '{"ref": "b2"}', index=0),
        ),
        # ... or with no index at all
        (
            _call("a", "delete_block", '{"ref": "b1"}'),
            _call("b", "delete_block", '{"ref": "b2"}'),
        ),
    ],
)
def test_parallel_calls_stay_apart(monkeypatch, first, second):
    """D57, a code review: merged, two calls became one unreadable call."""
    chunks = [_delta({"tool_calls": [first]}), _delta({"tool_calls": [second]})]
    client, _ = _client(monkeypatch, Response(chunks=chunks))
    calls = client.chat([], []).tool_calls
    assert [(c["id"], c["function"]["arguments"]) for c in calls] == [
        ("a", '{"ref": "b1"}'),
        ("b", '{"ref": "b2"}'),
    ]


def test_pieces_without_index_continue_the_last_call(monkeypatch):
    chunks = [
        _delta({"tool_calls": [_call("a", "edit_block", '{"ref"')]}),
        _delta({"tool_calls": [{"function": {"arguments": ': "b1"}'}}]}),
    ]
    client, _ = _client(monkeypatch, Response(chunks=chunks))
    [call] = client.chat([], []).tool_calls
    assert call["function"]["arguments"] == '{"ref": "b1"}'


@pytest.mark.parametrize(
    "chunk",
    [
        ["not", "an", "object"],
        {"choices": "nope"},
        _delta({"tool_calls": [{"index": None, "function": {"arguments": [1]}}]}),
    ],
)
def test_malformed_chunks_are_a_gateway_failure(monkeypatch, chunk):
    """Not a 500 of this service: an error the service turns into
    llm_failed (D57, a code review)."""
    client, _ = _client(monkeypatch, Response(chunks=[chunk]))
    try:
        result = client.chat([], [])
    except client_module.AIEditClientError:
        return
    # Tolerated: nothing usable came through
    assert result.tool_calls in (
        [],
        [{"type": "function", "function": {"arguments": ""}}],
    )
