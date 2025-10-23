from kitconcept.intranet import logger
from plone import api
from Products.GenericSetup.tool import SetupTool


def reindex_person(setup_tool: SetupTool):
    """Reindex Person content."""
    catalog = api.portal.get_tool("portal_catalog")
    i = 0
    for brain in catalog.unrestrictedSearchResults(portal_type="Person"):
        obj = brain._unrestrictedGetObject()
        obj.reindexObject(idxs=["Title"], update_metadata=1)
        i += 1
    logger.info(f"Reindexed {i} Person content items.")
