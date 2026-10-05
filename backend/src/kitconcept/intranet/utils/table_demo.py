"""Create the two wiki-table demo pages on a site.

The pages ("Projektbudget 2026" and "Teilnehmende Konsortialtreffen" in the
GreenCat workspace) come from ``table_demo_content``. They are created by
the distribution's post handler after the content import; safe to run
again: existing pages are left alone.
"""

from kitconcept.intranet import logger
from kitconcept.intranet.utils import table_demo_content as content
from plone import api
from Products.CMFPlone.Portal import PloneSite


def create_table_demo_pages(site: PloneSite) -> int:
    """Create the demo pages. Return the number of pages created."""
    # Traverse without security checks: with the restricted workflow the
    # workspace is not accessible to the user running the site creation.
    container = site.unrestrictedTraverse(content.CONTAINER_PATH.strip("/"), None)
    if container is None:
        logger.info(
            f"{content.CONTAINER_PATH} not found, skipping the table demo pages"
        )
        return 0
    created = 0
    with api.env.adopt_roles(["Manager"]):
        for page_id, page_title, blocks, blocks_layout in content.pages():
            if page_id in container:
                logger.info(f"Table demo page {page_id} already exists, skipping")
                continue
            page = api.content.create(
                container=container,
                type="WikiPage",
                id=page_id,
                title=page_title,
                blocks=blocks,
                blocks_layout=blocks_layout,
            )
            logger.info(f"Created table demo page {page.absolute_url()}")
            created += 1
    return created
