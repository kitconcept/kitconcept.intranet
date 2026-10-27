from kitconcept.intranet import logger
from kitconcept.intranet.controlpanels.intranet import IIntranetSettings
from plone.registry.interfaces import IRegistry
from Products.GenericSetup.tool import SetupTool
from zope.component import getUtility


def add_intranet_settings_records(setup_tool: SetupTool):
    """Add the records IIntranetSettings gained (``enable_ai_edit``).

    Registering the interface adds missing records and keeps the value of
    every existing one. Importing the profile's registry files instead
    would reset values an admin changed (``plone.email_from_name``, ...).
    """
    registry = getUtility(IRegistry)
    registry.registerInterface(IIntranetSettings, prefix="kitconcept.intranet")
    logger.info("Added the new records of the intranet settings")
