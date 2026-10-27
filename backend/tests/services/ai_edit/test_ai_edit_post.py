from kitconcept.intranet.ai_edit.client import AIEditClientError
from kitconcept.intranet.ai_edit.client import AIEditTimeout
from kitconcept.intranet.ai_edit.client import ChatResult
from kitconcept.intranet.ai_edit.config import ENV_TRACE
from kitconcept.intranet.ai_edit.config import AIEditConfig
from kitconcept.intranet.services import ai_edit as ai_edit_service

import json
import logging
import pytest


def configured(context_length=None):
    return lambda: AIEditConfig(
        base_url="http://llm.invalid",
        token=None,
        chat_model="test",
        context_length=context_length,
    )


class TestAIEditPermission:
    """One endpoint for the edit form (on the content) and the add form
    (on the folder), gated by the "Use AI editing" permission."""

    @pytest.fixture(autouse=True)
    def _setup(self, functional_portal, anon_request, user_request, payload):
        self.anon_request = anon_request
        self.user_request = user_request
        self.payload = payload

    def call(self, request, method: str, path: str):
        url = f"{path.rstrip('/')}/@ai-edit"
        if method == "get":
            return request.get(url)
        return request.post(url, json=self.payload)

    @pytest.mark.parametrize("method", ["get", "post"])
    def test_anonymous(self, method):
        assert self.call(self.anon_request, method, "/doc").status_code == 401

    @pytest.mark.parametrize("method", ["get", "post"])
    @pytest.mark.parametrize(
        "username,path,status_code",
        [
            ("member", "/doc", 401),
            ("member", "/", 401),
            # Reviewers may edit in some states but are not granted the assistant
            ("reviewer", "/doc", 401),
            # Edit form
            ("editor", "/doc", 200),
            # Add form: called on the folder
            ("contributor", "/", 200),
            ("owner", "/own-doc", 200),
            ("owner", "/doc", 401),
        ],
    )
    def test_roles(self, method, username, path, status_code):
        response = self.call(self.user_request(username), method, path)
        assert response.status_code == status_code

    def test_available_not_configured(self):
        response = self.user_request("editor").get("/doc/@ai-edit")
        assert response.json() == {
            "available": False,
            "error_code": "not_configured",
        }

    def test_available_with_budget_values(self, monkeypatch):
        """The browser keeps requests inside the gateway's context (D22)."""
        monkeypatch.setattr(
            ai_edit_service, "get_ai_edit_config", configured(context_length=40960)
        )
        data = self.user_request("editor").get("/doc/@ai-edit").json()
        assert data["available"] is True
        assert data["context_length"] == 40960
        assert data["reserve_tokens"] == 4096
        # One tool since D58: no toolsets to choose from
        assert "toolset" not in data
        assert "toolsets" not in data
        # Base rules, tool rules and tool definition: several kB
        assert data["fixed_prompt_chars"] > 3000
        assert data["operations"] == [
            "set_page_field",
            "edit_block",
            "replace_text",
            "insert_block",
            "insert_blocks",
            "delete_block",
            "move_block",
        ]
        assert "layout" in data["categories"]
        assert data["structural_tags"] == [
            "block",
            "page",
            "summary",
            "type",
            "types",
        ]

    def test_available_tells_the_trace(self, monkeypatch):
        """The trace switch also turns on the browser's console logging."""
        monkeypatch.setattr(ai_edit_service, "get_ai_edit_config", configured())
        monkeypatch.delenv(ENV_TRACE, raising=False)
        assert self.user_request("editor").get("/doc/@ai-edit").json()["trace"] is False
        monkeypatch.setenv(ENV_TRACE, "1")
        assert self.user_request("editor").get("/doc/@ai-edit").json()["trace"] is True

    def test_not_configured(self):
        response = self.user_request("editor").post("/doc/@ai-edit", json=self.payload)
        data = response.json()
        assert data["error_code"] == "not_configured"
        assert data["tool_calls"] == []

    @pytest.mark.parametrize(
        "body",
        [
            "[]",
            json.dumps({"messages": []}),
            json.dumps({"page": [], "messages": [{"role": "user", "content": "x"}]}),
            json.dumps({"page": {}, "messages": "x"}),
            # JSON, but no object
            '"x"',
            "1",
            json.dumps({"page": {}, "messages": [{"role": "assistant"}]}),
            # A repair call ends with the tool result, a normal one doesn't
            json.dumps({
                "page": {},
                "repair": True,
                "messages": [{"role": "user", "content": "x"}],
            }),
        ],
    )
    def test_bad_request(self, body):
        response = self.user_request("editor").post(
            "/doc/@ai-edit",
            data=body,
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 400


class TestAIEditCall:
    """The service with a mocked LLM: one call, the answer passed through."""

    @pytest.fixture(autouse=True)
    def _setup(self, functional_portal, user_request, payload, monkeypatch):
        self.user_request = user_request
        self.payload = payload
        self.sent = {}
        monkeypatch.setattr(ai_edit_service, "get_ai_edit_config", configured())

        def chat(client, messages, tools):
            self.sent = {"messages": messages, "tools": tools}
            if isinstance(self.answer, Exception):
                raise self.answer
            return self.answer

        monkeypatch.setattr(ai_edit_service.AIEditClient, "chat", chat)

    @staticmethod
    def tool_call(operations: list[dict]) -> ChatResult:
        return ChatResult(
            content="",
            tool_calls=[
                {
                    "id": "call_1",
                    "function": {
                        "name": "propose_changes",
                        "arguments": json.dumps({"operations": operations}),
                    },
                }
            ],
            finish_reason="tool_calls",
        )

    def post(self):
        response = self.user_request("editor").post("/doc/@ai-edit", json=self.payload)
        assert response.status_code == 200
        return response.json()

    def test_tools_offered(self):
        self.answer = ChatResult(content="Fine.", tool_calls=[], finish_reason="stop")
        data = self.post()
        assert data["message"] == "Fine."
        assert data["finish_reason"] == "stop"
        assert [t["function"]["name"] for t in self.sent["tools"]] == [
            "propose_changes"
        ]

    def test_history_keeps_only_propose_changes(self):
        """Calls of other tools (the intent toolset's, removed in D58) are
        dropped from the history; a request's "toolset" is ignored."""
        self.answer = ChatResult(content="Fine.", tool_calls=[], finish_reason="stop")
        self.payload = {
            **self.payload,
            "toolset": "intent",
            "messages": [
                {"role": "user", "content": "Delete it"},
                {
                    "role": "assistant",
                    "content": "",
                    "tool_calls": [
                        {
                            "id": "call_1",
                            "function": {
                                "name": "propose_changes",
                                "arguments": '{"operations": []}',
                            },
                        },
                        {
                            "id": "call_2",
                            "function": {
                                "name": "delete_block",
                                "arguments": '{"ref": "b1", "reason": "Old."}',
                            },
                        },
                    ],
                },
                {"role": "tool", "tool_call_id": "call_1", "content": "Applied."},
                {"role": "user", "content": "Improve the title"},
            ],
        }
        self.post()
        assert [t["function"]["name"] for t in self.sent["tools"]] == [
            "propose_changes"
        ]
        # The request's insertable types as the values of an insert's type
        item = self.sent["tools"][0]["function"]["parameters"]["properties"][
            "operations"
        ]["items"]
        assert item["properties"]["type"]["enum"] == ["slate"]
        assert item["properties"]["blocks"]["items"]["properties"]["type"]["enum"] == [
            "slate"
        ]
        _system, _user, assistant, tool, _current = self.sent["messages"]
        assert [c["function"]["name"] for c in assistant["tool_calls"]] == [
            "propose_changes"
        ]
        assert tool["content"] == "Applied."

    def test_system_prompt(self):
        """Base rules with date and language, the tool's rules, the types
        legend and the page (spec §6)."""
        self.answer = ChatResult(content="Fine.", tool_calls=[], finish_reason="stop")
        self.post()
        system, user = self.sent["messages"]
        assert user == {"role": "user", "content": "Improve the title"}
        content = system["content"]
        assert "Answer in English" in content
        assert "Today is 20" in content
        assert "How to use propose_changes:" in content
        assert (
            "insertable: slate\n"
            '<type name="slate" insertable="yes">\nfields: text\n'
            "theme: default | grey\n</type>" in content
        )
        assert content.endswith(
            "<page>\n"
            "title: Old title\n"
            'description: ""\n'
            '<block ref="b1" type="slate" selected>\n'
            "text: Some text\n"
            "theme: default\n"
            "</block>\n"
            '<block ref="b2" type="slate" locked="text">\n'
            "text: | a |\n"
            "</block>\n"
            "</page>"
        )

    def test_tool_calls_passed_through(self):
        """The harness validates the calls, malformed ones included: they
        come back as they are, with ids."""
        operations = [{"op": "set_page_field", "field": "title", "value": "New"}]
        call = self.tool_call(operations).tool_calls[0]
        broken = {"function": {"name": "propose_changes", "arguments": '{"oper'}}
        self.answer = ChatResult(
            content="", tool_calls=[call, broken, "junk"], finish_reason="tool_calls"
        )
        data = self.post()
        first, second = data["tool_calls"]
        assert first == call
        assert second["function"] == broken["function"]
        assert second["id"].startswith("call_")

    def test_repair_call(self):
        """The repair call (D8) ends with the tool result naming the failed
        operations; the assistant's call stays paired with it."""
        self.payload["repair"] = True
        self.payload["messages"] += [
            {
                "role": "assistant",
                "content": "",
                "tool_calls": self.tool_call([{"op": "edit_block"}]).tool_calls,
            },
            {
                "role": "tool",
                "tool_call_id": "call_1",
                "content": "Some operations could not be used.",
            },
        ]
        self.answer = self.tool_call([])
        self.post()
        roles = [m["role"] for m in self.sent["messages"]]
        assert roles == ["system", "user", "assistant", "tool"]

    def test_usage(self):
        raw = {
            "usage": {
                "prompt_tokens": 5200,
                "completion_tokens": 900,
                "completion_tokens_details": {"reasoning_tokens": 700},
            }
        }
        self.answer = ChatResult(
            content="Fine.", tool_calls=[], finish_reason="stop", raw=raw
        )
        assert self.post()["usage"] == {
            "prompt_tokens": 5200,
            "completion_tokens": 900,
            "reasoning_tokens": 700,
            "reasoning": True,
            "input_truncated": False,
        }

    def test_reasoning_passed_on(self):
        """The reasoning goes to the browser (eval, debugging), never into
        the conversation."""
        self.answer = ChatResult(
            content="Fine.",
            tool_calls=[],
            finish_reason="stop",
            reasoning=True,
            reasoning_text="The title is fine.",
        )
        assert self.post()["reasoning"] == "The title is fine."

    def test_input_truncated(self, caplog):
        """Fewer prompt tokens than the request's size allows: the gateway
        cut the input (a 2048-token context in a browser test); flagged and
        logged as an error, not a model problem."""
        raw = {"usage": {"prompt_tokens": 50, "completion_tokens": 10}}
        self.answer = ChatResult(
            content="Fine.", tool_calls=[], finish_reason="stop", raw=raw
        )
        with caplog.at_level(logging.ERROR, logger="kitconcept.intranet.ai_edit"):
            usage = self.post()["usage"]
        assert usage["input_truncated"] is True
        [error] = [r.getMessage() for r in caplog.records if r.levelno == logging.ERROR]
        assert "the gateway cut the input: 50 prompt tokens" in error

    def test_request_too_large(self, monkeypatch):
        """A plain guard against abuse; the context budget is the browser's."""
        monkeypatch.setattr(ai_edit_service, "MAX_REQUEST_BYTES", 100)
        data = self.post()
        assert data["error_code"] == "request_too_large"
        assert self.sent == {}

    def test_truncated_answer(self):
        """The output limit cut the answer: the browser warns (D19)."""
        self.answer = ChatResult(
            content="Partly", tool_calls=[], finish_reason="length"
        )
        assert self.post()["finish_reason"] == "length"

    @pytest.mark.parametrize(
        "error,error_code",
        [
            (AIEditTimeout("timeout after 120s"), "llm_timeout"),
            (AIEditClientError("LLM gateway returned 502"), "llm_failed"),
        ],
    )
    def test_llm_errors(self, error, error_code):
        """A timeout is told apart from other failures; neither shows
        details (host, upstream response) to the browser."""
        self.answer = error
        result = self.post()
        assert result["error_code"] == error_code
        assert result["error"] == "The AI assistant could not answer"

    def test_failing_requests_release_their_slot(self, monkeypatch):
        """A request failing while it prepares the LLM call never keeps a
        concurrency slot (else the instance answers "busy" until restart)."""
        failures = ai_edit_service.MAX_CONCURRENT_REQUESTS + 1
        debug = ai_edit_service._debug

        def failing_debug(step, data):
            nonlocal failures
            if step == "request to the LLM" and failures:
                failures -= 1
                raise RuntimeError("boom")
            debug(step, data)

        self.answer = ChatResult(content="Fine.", tool_calls=[], finish_reason="stop")
        monkeypatch.setattr(ai_edit_service, "_debug", failing_debug)
        while failures:
            response = self.user_request("editor").post(
                "/doc/@ai-edit", json=self.payload
            )
            assert response.status_code == 500
        assert self.post()["error_code"] is None

    def test_logging(self, caplog, monkeypatch):
        """One INFO line per request; the full round trip at DEBUG level."""
        monkeypatch.delenv(ENV_TRACE, raising=False)
        self.answer = self.tool_call([{"op": "delete_block", "block": "b2"}])
        with caplog.at_level(logging.DEBUG, logger="kitconcept.intranet.ai_edit"):
            self.post()
        [info] = [r.getMessage() for r in caplog.records if r.levelno == logging.INFO]
        assert "2 blocks" in info
        assert "1 tool calls" in info
        assert [
            r.getMessage().split(":", 1)[0]
            for r in caplog.records
            if r.levelno == logging.DEBUG
        ] == [
            "ai-edit request from the browser",
            "ai-edit request to the LLM",
            "ai-edit answer of the LLM (raw)",
            "ai-edit response to the browser",
        ]

    def test_trace(self, caplog, monkeypatch):
        """With the trace on, what the model gets and answers is logged
        readably at INFO; the tools only once per process."""
        monkeypatch.setenv(ENV_TRACE, "1")
        monkeypatch.setattr(ai_edit_service, "_tools_traced", False)
        self.answer = ChatResult(
            content="The title is fine.",
            tool_calls=[],
            finish_reason="stop",
            raw={
                "choices": [
                    {
                        "message": {
                            "content": "The title is fine.",
                            "reasoning_content": "Checking the title.",
                        },
                        "finish_reason": "stop",
                    }
                ]
            },
        )
        with caplog.at_level(logging.INFO, logger="kitconcept.intranet.ai_edit"):
            self.post()
            self.post()
        traces = [
            r.getMessage()
            for r in caplog.records
            if r.getMessage().startswith("ai-edit trace")
        ]
        assert [t.split("\n", 1)[0] for t in traces] == [
            "ai-edit trace: tools offered (once per process):",
            "ai-edit trace: request to the LLM for /plone/doc, 2 messages",
            traces[2].split("\n", 1)[0],
            "ai-edit trace: request to the LLM for /plone/doc, 2 messages",
            traces[4].split("\n", 1)[0],
        ]
        request, answer = traces[1], traces[2]
        # The page as the model reads it, and the request
        assert "----- 0: system -----" in request
        assert '<block ref="b1" type="slate" selected>' in request
        assert "----- 1: user -----\nImprove the title" in request
        assert answer.startswith("ai-edit trace: answer of the LLM after ")
        assert "----- reasoning -----\nChecking the title." in answer
        assert "----- text -----\nThe title is fine." in answer

    def test_empty_answer_logs_the_response_shape(self, caplog):
        """Nothing usable arrived: what the gateway's response held is
        logged, without the model's output (the warning is on in
        production)."""
        raw = {
            "choices": [
                {
                    "message": {"content": "", "reasoning_content": "Private."},
                    "finish_reason": "stop",
                }
            ],
            "usage": {"completion_tokens": 750},
        }
        self.answer = ChatResult(
            content="", tool_calls=[], finish_reason="stop", raw=raw
        )
        with caplog.at_level(logging.INFO, logger="kitconcept.intranet.ai_edit"):
            self.post()
        [info] = [r.getMessage() for r in caplog.records if r.levelno == logging.INFO]
        assert "750 completion tokens" in info
        [warning] = [
            r.getMessage() for r in caplog.records if r.levelno == logging.WARNING
        ]
        assert '"completion_tokens": 750' in warning
        assert '"reasoning_content": 8' in warning
        assert "Private." not in warning
