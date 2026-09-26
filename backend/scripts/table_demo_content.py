#!/usr/bin/env python3
"""Create the wiki-table demo pages on a running site.

Creates "Projektbudget 2026" and "Teilnehmende Konsortialtreffen" in a
workspace. The content comes from
``kitconcept.intranet.utils.table_demo_content``; the same pages are
created by the distribution's post handler when a site is created with the
example content, so this script is only needed on sites that already exist
(for example plone-intranet.kitconcept.io).

Uses only the REST API. Existing pages are deleted first, so the script
can be run again. Run it from ``backend/`` inside the project environment:

    uv run python scripts/table_demo_content.py \\
        --url https://plone-intranet.kitconcept.io \\
        --user admin --password '...' \\
        --container /workspaces/eu-projekt-greencat

Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655
"""

from __future__ import annotations

from kitconcept.intranet.utils import table_demo_content as content

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

    def post(self, path: str, payload: dict) -> dict:
        return self._request("POST", path, payload)

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
        help="Path of the workspace (or folder) the pages are created in",
    )
    args = parser.parse_args()

    client = Client(args.url, args.user, args.password)
    for page_id, page_title, blocks, blocks_layout in content.pages():
        page_path = f"{args.container.rstrip('/')}/{page_id}"
        client.delete(page_path)
        created = client.post(
            args.container,
            {
                "@type": "WikiPage",
                "id": page_id,
                "title": page_title,
                "blocks": blocks,
                "blocks_layout": blocks_layout,
            },
        )
        print(f"created {created['@id']}")


if __name__ == "__main__":
    main()
