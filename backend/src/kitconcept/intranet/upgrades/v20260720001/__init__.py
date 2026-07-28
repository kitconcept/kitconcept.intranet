from kitconcept.intranet import logger
from plone import api
from Products.CMFPlone.WorkflowTool import WorkflowTool
from Products.GenericSetup.tool import SetupTool


PROFILE_ID = "kitconcept.intranet:restricted"


def upgrade_plone_site_permissions(context: SetupTool):
    """Upgrade Plone Site permissions and workflow."""
    # Check if restricted profile is applied
    install_date: str | None = context.getProfileImportDate(f"profile-{PROFILE_ID}")
    if not install_date:
        logger.info("- Restricted profile not applied, no need for an upgrade.")
        return
    # The restricted profile did not have a version, so we set it here
    context.setLastVersionForProfile(PROFILE_ID, "1000")
    # Upgrade the profile
    logger.info("- Restricted profile applied, upgrading to version 1001.")
    context.upgradeProfile(PROFILE_ID, dest="1001")
    # Update security settings from the workflow tool
    wt: WorkflowTool = api.portal.get_tool("portal_workflow")
    logger.info("- Updating security settings in the catalog.")
    wt.updateRoleMappings()
    logger.info("- Upgrade complete.")
