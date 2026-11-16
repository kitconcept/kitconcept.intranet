from kitconcept.intranet.tasks.catalog import synchronize
from plone import api


def install_inline_tasks(context):
    """Install task catalog fields and backfill existing Wiki Pages."""
    context.runImportStepFromProfile("profile-kitconcept.intranet:default", "catalog")
    catalog = api.portal.get_tool("portal_catalog")
    for brain in catalog.unrestrictedSearchResults(portal_type="WikiPage"):
        synchronize(brain.getObject(), catalog, legacy=True)
