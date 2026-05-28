from kitconcept.intranet.vocabularies.base import invalidate_vocabulary_cache
from plone.dexterity.content import DexterityContent
from typing import Union
from zope.lifecycleevent import ObjectAddedEvent
from zope.lifecycleevent import ObjectModifiedEvent

import logging


logger = logging.getLogger("kitconcept.intranet")


EVENTS = Union[ObjectAddedEvent, ObjectModifiedEvent]
KEYS = {
    "Organisational Unit": "kitconcept.intranet.vocabularies.organisational_unit",
    "Location": "kitconcept.intranet.vocabularies.location",
}


def cache_buster(obj: DexterityContent, event: EVENTS):
    """Invalidate vocabulary cache if a content is modified.
    :param obj: Dexterity Content
    :param event: Object event
    """
    portal_type = obj.portal_type
    key = KEYS.get(portal_type)
    if key:
        invalidate_vocabulary_cache(key)
        path = "/".join(obj.getPhysicalPath())
        logger.info(f"Invalidated cache for {key} as {path} was modified")
