from kitconcept.intranet import logger
from Products.GenericSetup.tool import SetupTool
from Products.GenericSetup.tool import UNKNOWN


SOLR_PROFILE_ID = "kitconcept.solr:default"


def upgrade_kitconcept_solr(setup_tool: SetupTool):
    """Upgrade kitconcept.solr to the latest profile version, if installed.

    The distribution installs kitconcept.solr only on sites created with
    Solr support, so bail out when the profile was never applied.
    """
    if setup_tool.getLastVersionForProfile(SOLR_PROFILE_ID) == UNKNOWN:
        logger.info(f"{SOLR_PROFILE_ID} is not installed, nothing to upgrade")
        return
    if setup_tool.hasPendingUpgrades(SOLR_PROFILE_ID):
        setup_tool.upgradeProfile(SOLR_PROFILE_ID)
        current_version = setup_tool.getLastVersionForProfile(SOLR_PROFILE_ID)
        logger.info(f"Upgraded {SOLR_PROFILE_ID} to version {current_version}")
    else:
        logger.info(f"{SOLR_PROFILE_ID} is already up to date")
