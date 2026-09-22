#!/usr/bin/env python3
"""Create the demo content for the Wiki Page history diff on a running site.

Creates the demo page "Jour fixe KW 38" in a workspace and edits it three
times, so it has four versions with change notes. The content and the
edits come from ``kitconcept.intranet.utils.diff_demo_content``; the same
edits are applied by the distribution's post handler when a site is
created with the example content, so this script is only needed on sites
that already exist (for example plone-intranet.kitconcept.io).

Uses only the REST API. The page is deleted first if it exists, so the
script can be run again. Run it from ``backend/`` inside the project
environment:

    uv run python scripts/diff_demo_content.py \\
        --url https://plone-intranet.kitconcept.io \\
        --user admin --password '...' \\
        --container /workspaces/eu-projekt-greencat

Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/642
"""

from __future__ import annotations

from kitconcept.intranet.utils import diff_demo_content as content

import argparse
import json
import sys
import urllib.error
import urllib.request


class Client:
    def __init__(self, base_url: str, user: str, password: str):
        self.api = base_url.rstrip("/") + "/++api++"
        self.token = self._request(
            "POST", "/@login", {"login": user, "password": password}
        )["token"]

    def _request(self, method: str, path: str, payload: dict | None = None) -> dict:
        url = path if path.startswith("http") else self.api + path
        if not url.startswith(("http://", "https://")):
            sys.exit(f"unsupported URL scheme: {url}")
        data = json.dumps(payload).encode() if payload is not None else None
        request = urllib.request.Request(url, data=data, method=method)  # noqa: S310
        request.add_header("Accept", "application/json")
        request.add_header("Content-Type", "application/json")
        if hasattr(self, "token"):
            request.add_header("Authorization", f"Bearer {self.token}")
        try:
            with urllib.request.urlopen(request) as response:  # noqa: S310
                body = response.read()
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as error:
            if error.code == 404 and method == "DELETE":
                return {}
            sys.exit(f"{method} {url} failed: {error.code} {error.read()[:300]!r}")

    def get(self, path: str) -> dict:
        return self._request("GET", path)

    def post(self, path: str, payload: dict) -> dict:
        return self._request("POST", path, payload)

    def patch(self, path: str, payload: dict) -> dict:
        return self._request("PATCH", path, payload)

    def delete(self, path: str) -> dict:
        return self._request("DELETE", path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--url", default="http://localhost:8080/Plone", help="Site URL")
    parser.add_argument("--user", default="admin")
    parser.add_argument("--password", default="admin")
    parser.add_argument(
        "--container",
        default=content.CONTAINER_PATH,
        help="Path of the workspace (or folder) the page is created in",
    )
    args = parser.parse_args()

    client = Client(args.url, args.user, args.password)
    page_path = f"{args.container.rstrip('/')}/{content.PAGE_ID}"

    client.delete(page_path)
    created = client.post(
        args.container,
        {
            "@type": "WikiPage",
            "id": content.PAGE_ID,
            "title": content.PAGE_TITLE,
            "blocks": content.blocks(content.version_0()),
            "blocks_layout": content.blocks_layout(),
        },
    )
    page_url = created["@id"]
    print(f"created {page_url}")

    for value, note in content.edits():
        client.patch(page_path, {"blocks": content.blocks(value), "changeNote": note})
        print(f"  version: {note}")

    history = client.get(f"{page_path}/@history")
    versions = [entry for entry in history if entry.get("version") is not None]
    print(f"{len(versions)} versions:")
    for entry in sorted(versions, key=lambda e: e["version"]):
        print(f"  {entry['version']}  {entry.get('comments') or ''}")
    print("history view:", f"{page_url}/historyview")
    print("text changes: ", f"{page_url}/diff?one=0&two=1&view=split")
    print("list + callout:  ", f"{page_url}/diff?one=1&two=2&view=unified")
    print("settings:     ", f"{page_url}/diff?one=2&two=3&view=unified")


if __name__ == "__main__":
    main()
