from kitconcept.intranet.upgrades.helpers import upgrade_cmfplone
from Products.GenericSetup.tool import SetupTool


def upgrade_plone_612(setup_tool: SetupTool):
    """Upgrade Products.CMFPlone to version 6.1.2."""
    upgrade_cmfplone()
