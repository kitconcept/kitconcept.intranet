from kitconcept.intranet.utils import plone_client

import argparse
import json
import pytest
import requests


class FakeSite(requests.adapters.BaseAdapter):
    """Answers requests without a network; records what was sent."""

    def __init__(self, routes: dict[tuple[str, str], tuple[int, object]]):
        super().__init__()
        self.routes = routes
        self.sent: list[requests.PreparedRequest] = []

    def send(self, request, **kwargs):
        self.sent.append(request)
        path = request.url.split("/++api++", 1)[-1]
        status, body = self.routes.get(
            (request.method, path), (404, {"type": "NotFound"})
        )
        response = requests.Response()
        response.status_code = status
        response._content = json.dumps(body).encode() if body is not None else b""
        response.url = request.url
        response.request = request
        return response

    def close(self):
        pass


LOGIN = {("POST", "/@login"): (200, {"token": "secret-token"})}


def client_for(routes: dict, **kwargs) -> tuple[plone_client.PloneClient, FakeSite]:
    site = FakeSite({**LOGIN, **routes})
    session = requests.Session()
    session.mount("http://", site)
    client = plone_client.PloneClient(
        "http://site/Plone/", "admin", "admin", session=session, **kwargs
    )
    return client, site


class TestPloneClient:
    def test_logs_in_and_sends_the_token(self):
        client, site = client_for({("GET", "/page"): (200, {"title": "Page"})})
        assert client.get("/page") == {"title": "Page"}
        login, get = site.sent
        assert login.url == "http://site/Plone/++api++/@login"
        assert json.loads(login.body) == {"login": "admin", "password": "admin"}
        assert "Authorization" not in login.headers
        assert get.headers["Authorization"] == "Bearer secret-token"
        assert get.headers["Accept"] == "application/json"

    def test_default_user_agent(self):
        client, site = client_for({("GET", "/page"): (200, {})})
        client.get("/page")
        assert {r.headers["User-Agent"] for r in site.sent} == {
            plone_client.DEFAULT_USER_AGENT
        }
        # A browser User-Agent, not a bot-like one (Cloudflare).
        assert plone_client.DEFAULT_USER_AGENT.startswith("Mozilla/5.0 ")

    def test_user_agent_override(self):
        client, site = client_for({("GET", "/page"): (200, {})}, user_agent="Tester/1")
        client.get("/page")
        assert {r.headers["User-Agent"] for r in site.sent} == {"Tester/1"}

    def test_post_sends_json(self):
        client, site = client_for({("POST", "/folder"): (201, {"@id": "x"})})
        assert client.post("/folder", {"@type": "WikiPage"}) == {"@id": "x"}
        assert json.loads(site.sent[-1].body) == {"@type": "WikiPage"}
        assert site.sent[-1].headers["Content-Type"] == "application/json"

    def test_empty_body(self):
        client, _site = client_for({("PATCH", "/page"): (204, None)})
        assert client.patch("/page", {"title": "New"}) == {}

    def test_full_url(self):
        client, site = client_for({("GET", "/page/@history"): (200, [])})
        assert client.get("http://site/Plone/++api++/page/@history") == []
        assert site.sent[-1].url == "http://site/Plone/++api++/page/@history"

    def test_error_status_raises(self):
        client, _site = client_for({("DELETE", "/locked"): (423, {"type": "Locked"})})
        with pytest.raises(plone_client.PloneClientError, match=r"DELETE .* 423"):
            client.delete("/locked")

    def test_connection_error_raises(self):
        client, site = client_for({})

        def refuse(request, **kwargs):
            raise requests.ConnectionError("refused")

        site.send = refuse
        with pytest.raises(plone_client.PloneClientError, match=r"GET .* refused"):
            client.get("/page")

    def test_missing_ok(self):
        client, _site = client_for({})
        assert client.delete("/gone", missing_ok=True) == {}
        with pytest.raises(plone_client.PloneClientError, match="404"):
            client.delete("/gone")


class TestArguments:
    def parse(self, *argv: str) -> argparse.Namespace:
        parser = argparse.ArgumentParser()
        plone_client.add_arguments(parser)
        return parser.parse_args(argv)

    def test_defaults(self, monkeypatch):
        monkeypatch.delenv(plone_client.USER_AGENT_ENV, raising=False)
        args = self.parse()
        assert args.url == "http://localhost:8080/Plone"
        assert (args.user, args.password) == ("admin", "admin")
        assert args.user_agent == plone_client.DEFAULT_USER_AGENT

    def test_user_agent_from_environment(self, monkeypatch):
        monkeypatch.setenv(plone_client.USER_AGENT_ENV, "Cluster/1")
        assert self.parse().user_agent == "Cluster/1"

    def test_user_agent_option_wins(self, monkeypatch):
        monkeypatch.setenv(plone_client.USER_AGENT_ENV, "Cluster/1")
        assert self.parse("--user-agent", "Mine/2").user_agent == "Mine/2"
