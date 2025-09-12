from kitconcept.intranet import logger
from Products.GenericSetup.tool import SetupTool


def upgrade_collective_person(setup_tool: SetupTool):
    """Upgrade collective.person to the latest version."""
    profile_id = "collective.person:default"
    logger.info(f"Upgrading profile {profile_id}")
    if setup_tool.hasPendingUpgrades(profile_id):
        setup_tool.upgradeProfile(profile_id)
        current_version = setup_tool.getLastVersionForProfile(profile_id)
        logger.info(f"Upgraded {profile_id} to version {current_version}")
