from kitconcept.intranet import logger
from plone import api
from Products.CMFPlone.MigrationTool import MigrationTool
from Products.GenericSetup.tool import SetupTool


def upgrade_plone_611(setup_tool: SetupTool):
    """Upgrade Products.CMFPlone to version 6.1.1."""
    request = api.env.getRequest()
    migration_tool: MigrationTool = api.portal.get_tool("portal_migration")
    result = migration_tool.upgrade(request, dry_run=False, swallow_errors=True)
    logger.info(f"Upgrade to Plone 6.1.1. {result}")
