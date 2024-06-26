from kitconcept.intranet import logger
from kitconcept.intranet.setuphandlers import content
from kitconcept.intranet.setuphandlers import users
from kitconcept.intranet.upgrades import remove_preview_image_behavior
from plone import api
from Products.CMFPlone.interfaces import INonInstallable
from zope.interface import implementer


@implementer(INonInstallable)
class HiddenProfiles:
    def getNonInstallableProfiles(self):
        """Hide uninstall profile from site-creation and quickinstaller."""
        return [
            "kitconcept.intranet:uninstall",
        ]


def post_install(setup_tool):
    remove_preview_image_behavior(setup_tool)


def populate_portal(context):
    """Post install script"""
    breakpoint()
    portal = api.portal.get()
    # Delete content
    content.delete_content(portal)
    logger.info("Deleted default portal content")
    user = users.create_default_user()
    creators = [user.id]
    logger.info("Created default user")
    # Create other users
    users.create_team_accounts()
    logger.info("Created team accounts")
    # Create Initial content
    content.populate_portal(portal, creators)
    logger.info("Created initial content")
    # Update cover content
    content.update_home(portal, creators)
