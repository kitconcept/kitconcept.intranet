"""Client for the REST API of a running Plone site, used by ``scripts/``.

No Plone imports: the scripts run outside Zope, against any site
(``http://localhost:8080/Plone``, plone-intranet.kitconcept.io, a cluster
deployment). Built on ``requests``; one session per client, logged in with a
token from ``@login``.

Sites behind Cloudflare (the kitconcept cluster) block requests that look
like bots, which includes the default User-Agent of ``requests``. The
scripts therefore send a browser User-Agent: ``--user-agent`` on the command
line, else the ``PLONE_CLIENT_USER_AGENT`` environment variable, else
``DEFAULT_USER_AGENT``.

Usage in a script::

    parser = argparse.ArgumentParser()
    plone_client.add_arguments(parser)
    args = parser.parse_args()
    client = plone_client.from_args(args)
    client.post("/workspaces", {"@type": "WikiPage", ...})
"""

from __future__ import annotations

import argparse
import os
import requests


# Desktop Chrome on macOS, as Chrome sends it (major version only, frozen
# OS token). Update the version when it gets old; an outdated browser
# version can look like a bot again.
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"
)
USER_AGENT_ENV = "PLONE_CLIENT_USER_AGENT"
DEFAULT_TIMEOUT = 60


class PloneClientError(Exception):
    """A request to the site failed (error status, no connection, timeout)."""


class PloneClient:
    """Logged-in session on the REST API (``<url>/++api++``) of a site."""

    def __init__(
        self,
        url: str,
        user: str,
        password: str,
        *,
        user_agent: str = DEFAULT_USER_AGENT,
        timeout: float = DEFAULT_TIMEOUT,
        session: requests.Session | None = None,
    ):
        self.api = url.rstrip("/") + "/++api++"
        self.timeout = timeout
        self.session = session or requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "User-Agent": user_agent,
        })
        token = self.post("/@login", {"login": user, "password": password})["token"]
        self.session.headers["Authorization"] = f"Bearer {token}"

    def request(
        self,
        method: str,
        path: str,
        payload: dict | None = None,
        *,
        missing_ok: bool = False,
    ) -> dict | list:
        """Send a request; ``path`` is relative to the API root or a full URL.

        Returns the decoded JSON body (``{}`` for an empty body). Raises
        ``PloneClientError`` for an error status (except 404 with
        ``missing_ok``) and when the site cannot be reached.
        """
        url = path if path.startswith(("http://", "https://")) else self.api + path
        try:
            response = self.session.request(
                method, url, json=payload, timeout=self.timeout
            )
        except requests.RequestException as error:
            raise PloneClientError(f"{method} {url} failed: {error}") from error
        if missing_ok and response.status_code == 404:
            return {}
        if not response.ok:
            raise PloneClientError(
                f"{method} {url} failed: {response.status_code} {response.text[:300]}"
            )
        return response.json() if response.content else {}

    def get(self, path: str) -> dict | list:
        return self.request("GET", path)

    def post(self, path: str, payload: dict) -> dict:
        return self.request("POST", path, payload)

    def patch(self, path: str, payload: dict) -> dict:
        return self.request("PATCH", path, payload)

    def delete(self, path: str, *, missing_ok: bool = False) -> dict:
        return self.request("DELETE", path, missing_ok=missing_ok)


def add_arguments(parser: argparse.ArgumentParser) -> None:
    """Add ``--url``, ``--user``, ``--password`` and ``--user-agent``."""
    parser.add_argument("--url", default="http://localhost:8080/Plone", help="Site URL")
    parser.add_argument("--user", default="admin")
    parser.add_argument("--password", default="admin")
    parser.add_argument(
        "--user-agent",
        default=os.environ.get(USER_AGENT_ENV) or DEFAULT_USER_AGENT,
        help=(
            "User-Agent header; sites behind Cloudflare block bot-like ones "
            f"(default: ${USER_AGENT_ENV}, else a desktop Chrome User-Agent)"
        ),
    )


def from_args(args: argparse.Namespace) -> PloneClient:
    """A logged-in client for the options added by ``add_arguments``."""
    return PloneClient(args.url, args.user, args.password, user_agent=args.user_agent)
