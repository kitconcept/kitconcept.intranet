"""Upgrade to 20261120001: Managers and Site Administrators get the site root back."""

from kitconcept.intranet import logger
from plone import api
from Products.CMFPlone.WorkflowTool import WorkflowTool
from Products.GenericSetup.tool import SetupTool


PROFILE_ID = "kitconcept.intranet:restricted"


def upgrade_restricted_rolemap(context: SetupTool) -> None:
    """Reapply the rolemap of the restricted profile, on restricted sites only.

    The rolemap now grants *Access contents information* and *View* on the
    site root to Manager and Site Administrator as well. Sites without the
    restricted profile keep their own permissions.

    :param context: The ``portal_setup`` tool.
    """
    # Check if restricted profile is applied
    install_date: str | None = context.getProfileImportDate(f"profile-{PROFILE_ID}")
    if not install_date:
        logger.info("- Restricted profile not applied, no need for an upgrade.")
        return
    # Reimport the rolemap of the restricted profile (version 1002)
    logger.info("- Restricted profile applied, upgrading to version 1002.")
    context.upgradeProfile(PROFILE_ID, dest="1002")
    # Update security settings from the workflow tool
    wt: WorkflowTool = api.portal.get_tool("portal_workflow")
    logger.info("- Updating security settings in the catalog.")
    wt.updateRoleMappings()
    logger.info("- Upgrade complete.")
