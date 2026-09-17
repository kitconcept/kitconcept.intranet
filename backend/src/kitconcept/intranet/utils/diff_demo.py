"""Create the history-diff demo page with its versions on a site.

Exported content carries no version history, so the demo page ("Jour fixe
KW 38" in the GreenCat workspace) is not part of the example content dump.
Instead this module creates it from ``diff_demo_content`` after the content
import and applies the three edits as versions with change notes, so a
freshly created site shows the full history in the diff view without a
manual step.

Used by the distribution's post handler; safe to run again: it does
nothing when the page already exists.
"""

from kitconcept.intranet import logger
from kitconcept.intranet.utils import diff_demo_content as content
from plone import api
from Products.CMFPlone.Portal import PloneSite


def create_demo_page(site: PloneSite) -> int:
    """Create the demo page and its versions. Return the number of versions."""
    # Traverse without security checks: with the restricted workflow the
    # workspace is not accessible to the user running the site creation.
    container = site.unrestrictedTraverse(content.CONTAINER_PATH.strip("/"), None)
    with api.env.adopt_roles(["Manager"]):
        if container is None:
            logger.info(
                f"{content.CONTAINER_PATH} not found, skipping the diff demo page"
            )
            return 0
        if content.PAGE_ID in container:
            logger.info("Diff demo page already exists, skipping")
            return 0
        page = api.content.create(
            container=container,
            type="WikiPage",
            id=content.PAGE_ID,
            title=content.PAGE_TITLE,
            blocks=content.blocks(content.version_0()),
            blocks_layout={"items": []},
        )
        repository = api.portal.get_tool("portal_repository")
        if not repository.isVersionable(page):
            logger.info("WikiPage is not versionable, diff demo page has no history")
            return 0
        if not repository.getHistoryMetadata(page):
            repository.save(obj=page, comment="Initialversion")
        for value, note in content.edits():
            page.blocks = content.blocks(value)
            # No modified event: the auto-versioning subscriber would save a
            # second, note-less version for every edit.
            page.setModificationDate()
            page.reindexObject()
            repository.save(obj=page, comment=note)
        versions = repository.getHistoryMetadata(page).getLength(countPurged=False)
    logger.info(
        f"Created diff demo page {page.absolute_url()} with {versions} versions"
    )
    return versions
