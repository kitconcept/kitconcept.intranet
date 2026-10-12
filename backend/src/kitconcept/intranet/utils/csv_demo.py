"""Create the CSV table demo (a CSV file and a Wiki Page showing it).

Both come from ``csv_demo_content`` and are created in the GreenCat
workspace by the distribution's post handler after the content import, next
to the table demo pages. Safe to run again: existing objects are left alone.
"""

from kitconcept.intranet import logger
from kitconcept.intranet.utils import csv_demo_content as content
from plone import api
from plone.namedfile.file import NamedBlobFile
from Products.CMFPlone.Portal import PloneSite


def create_csv_demo(site: PloneSite) -> int:
    """Create the file and the page. Return the number of objects created."""
    # Traverse without security checks: with the restricted workflow the
    # workspace is not accessible to the user running the site creation.
    container = site.unrestrictedTraverse(content.CONTAINER_PATH.strip("/"), None)
    if container is None:
        logger.info(f"{content.CONTAINER_PATH} not found, skipping the CSV demo")
        return 0
    created = 0
    with api.env.adopt_roles(["Manager"]):
        if content.FILE_ID in container:
            logger.info(f"CSV demo file {content.FILE_ID} already exists, skipping")
        else:
            file_ = api.content.create(
                container=container,
                type="File",
                id=content.FILE_ID,
                title=content.FILE_TITLE,
                file=NamedBlobFile(
                    data=content.FILE_TEXT.encode("utf-8"),
                    filename=content.FILE_ID,
                    contentType=content.FILE_CONTENT_TYPE,
                ),
            )
            logger.info(f"Created CSV demo file {file_.absolute_url()}")
            created += 1
        page_id, page_title, page_blocks, page_layout = content.page_fields()
        if page_id in container:
            logger.info(f"CSV demo page {page_id} already exists, skipping")
        else:
            page = api.content.create(
                container=container,
                type="WikiPage",
                id=page_id,
                title=page_title,
                blocks=page_blocks,
                blocks_layout=page_layout,
            )
            logger.info(f"Created CSV demo page {page.absolute_url()}")
            created += 1
    return created
