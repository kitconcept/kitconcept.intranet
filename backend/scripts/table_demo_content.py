#!/usr/bin/env python3
"""Create the wiki-table demo pages on a running site.

Creates "Projektbudget 2026" and "Teilnehmende Konsortialtreffen" in a
workspace. The content comes from
``kitconcept.intranet.utils.table_demo_content``; the same pages are
created by the distribution's post handler when a site is created with the
example content, so this script is only needed on sites that already exist
(for example plone-intranet.kitconcept.io).

Uses only the REST API, via ``kitconcept.intranet.utils.plone_client``
(it sends a browser User-Agent, which sites behind Cloudflare like the
kitconcept cluster require; override with ``--user-agent`` or
``$PLONE_CLIENT_USER_AGENT``). Existing pages are deleted first, so the
script can be run again. Run it from ``backend/`` inside the project
environment:

    uv run python scripts/table_demo_content.py \\
        --url https://plone-intranet.kitconcept.io \\
        --user admin --password '...' \\
        --container /workspaces/eu-projekt-greencat

Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655
"""

from __future__ import annotations

from kitconcept.intranet.utils import plone_client
from kitconcept.intranet.utils import table_demo_content as content

import argparse
import sys


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
    for page_id, page_title, blocks, blocks_layout in content.pages():
        page_path = f"{args.container.rstrip('/')}/{page_id}"
        client.delete(page_path, missing_ok=True)
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
    try:
        main()
    except plone_client.PloneClientError as error:
        sys.exit(str(error))
