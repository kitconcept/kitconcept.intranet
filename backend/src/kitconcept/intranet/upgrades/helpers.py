from kitconcept.intranet import logger
from plone import api
from Products.CMFPlone.MigrationTool import MigrationTool


def upgrade_cmfplone():
    """Upgrade Products.CMFPlone to latest version."""
    request = api.env.getRequest()
    migration_tool: MigrationTool = api.portal.get_tool("portal_migration")
    fs_version = migration_tool.getFileSystemVersion()
    instance_version = migration_tool.getInstanceVersion()
    sw_version = migration_tool.getSoftwareVersion()
    logger.info(
        f"Upgrading Products.CMFPlone ({sw_version}) from profile "
        f"version {instance_version} to {fs_version}"
    )
    result = migration_tool.upgrade(request, dry_run=False, swallow_errors=True)
    logger.info(f"Upgrade Result: {result}")
