from plone.registry.interfaces import IRegistry
from zope.component import getUtility


def disable_notification_center_for_upgraded_sites(context):
    """Disable the notification center for upgraded sites."""
    registry = getUtility(IRegistry)
    registry["kitconcept.intranet.enable_notification_center"] = False
