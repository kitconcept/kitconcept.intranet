from plone.registry.interfaces import IRegistry
from zope.component import getUtility


def disable_rating_for_upgraded_sites(context):
    """Disable content rating feature for upgraded sites."""

    registry = getUtility(IRegistry)
    registry["kitconcept.intranet.enable_content_rating"] = False
