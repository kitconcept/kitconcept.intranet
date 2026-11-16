#!/usr/bin/env python3
"""Create the wiki-table demo pages on a running site.

Creates "Projektbudget 2026", "Teilnehmende Konsortialtreffen" and
"Tabellenbreiten" in a workspace, and the CSV table demo: the file
"projektbudget-2026.csv" and the page "Projektbudget aus CSV-Datei" that
shows it. The content comes from
``kitconcept.intranet.utils.table_demo_content`` and ``csv_demo_content``;
the same objects are created by the distribution's post handler when a site
is created with the example content, so this script is only needed on sites
that already exist (for example plone-intranet.kitconcept.io).

Uses only the REST API, via ``kitconcept.intranet.utils.plone_client``
(it sends a browser User-Agent, which sites behind Cloudflare like the
kitconcept cluster require; override with ``--user-agent`` or
``$PLONE_CLIENT_USER_AGENT``). Existing pages are deleted first (unlocked
if they are open in the editor), so the script can be run again; the links
between the pages and the CSV table block point into ``--container``. Run
it from ``backend/`` inside the project environment:

    uv run python scripts/table_demo_content.py \\
        --url https://plone-intranet.kitconcept.io \\
        --user admin --password '...' \\
        --container /workspaces/eu-projekt-greencat

Tickets: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655,
https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/751,
https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/827
"""

from __future__ import annotations

from kitconcept.intranet.utils import csv_demo_content
from kitconcept.intranet.utils import plone_client
from kitconcept.intranet.utils import table_demo_content as content

import argparse
import base64
import sys


def remove(client: plone_client.PloneClient, path: str) -> None:
    """Delete the object at ``path`` if it exists, also when it is locked
    (open in the editor, or a lock left behind by a closed tab)."""
    client.request("DELETE", f"{path}/@lock", {"force": True}, missing_ok=True)
    client.delete(path, missing_ok=True)


def create_page(
    client: plone_client.PloneClient,
    container: str,
    page_id: str,
    page_title: str,
    blocks: dict,
    blocks_layout: dict,
) -> None:
    """Create the Wiki Page ``page_id`` in ``container``, replacing it."""
    remove(client, f"{container}/{page_id}")
    created = client.post(
        container,
        {
            "@type": "WikiPage",
            "id": page_id,
            "title": page_title,
            "blocks": blocks,
            "blocks_layout": blocks_layout,
        },
    )
    print(f"created {created['@id']}")


def create_csv_demo(client: plone_client.PloneClient, container: str) -> None:
    """Create the CSV file and the page showing it, replacing them."""
    page_fields = csv_demo_content.page_fields(container)
    # The page first: it refers to the file.
    remove(client, f"{container}/{csv_demo_content.PAGE_ID}")
    remove(client, f"{container}/{csv_demo_content.FILE_ID}")
    created = client.post(
        container,
        {
            "@type": "File",
            "id": csv_demo_content.FILE_ID,
            "title": csv_demo_content.FILE_TITLE,
            "file": {
                "data": base64.b64encode(
                    csv_demo_content.FILE_TEXT.encode("utf-8")
                ).decode("ascii"),
                "encoding": "base64",
                "filename": csv_demo_content.FILE_ID,
                "content-type": csv_demo_content.FILE_CONTENT_TYPE,
            },
        },
    )
    print(f"created {created['@id']}")
    create_page(client, container, *page_fields)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    plone_client.add_arguments(parser)
    parser.add_argument(
        "--container",
        default=content.CONTAINER_PATH,
        help="Path of the workspace (or folder) the pages are created in",
    )
    args = parser.parse_args()

    client = plone_client.from_args(args)
    container = args.container.rstrip("/")
    for page in content.pages(container):
        create_page(client, container, *page)
    create_csv_demo(client, container)


if __name__ == "__main__":
    try:
        main()
    except plone_client.PloneClientError as error:
        sys.exit(str(error))
