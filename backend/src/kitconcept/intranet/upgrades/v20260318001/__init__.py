from BTrees.OIBTree import OIBTree
from kitconcept.intranet import logger
from kitconcept.intranet.behaviors.location import ILocationBehavior
from kitconcept.intranet.behaviors.organisational_unit import (
    IOrganisationalUnitBehavior,
)
from plone import api
from zc.relation.interfaces import ICatalog
from zope.component import getUtility


def init_vocabulary_cache(context):
    """Initialize the vocabulary cache BTree on the portal."""
    portal = api.portal.get()
    if not hasattr(portal, "_vocab_cache"):
        portal._vocab_cache = OIBTree()


def migrate_values(context):
    relation_catalog = getUtility(ICatalog)

    for brain in api.content.find(
        object_provides=(
            ILocationBehavior.__identifier__,
            IOrganisationalUnitBehavior.__identifier__,
        ),
        unrestricted=True,
    ):
        obj = brain._unrestrictedGetObject()

        old_value = getattr(obj, "location_reference", None)
        if old_value is not None:
            new_value = [rel.to_object.UID() for rel in old_value if not rel.isBroken()]
            for rel in old_value:
                relation_catalog.unindex(rel)
            obj.location_reference = new_value
            logger.info(f"Updated location_reference for {brain.getPath()}")
            updated = True

        old_value = getattr(obj, "organisational_unit_reference", None)
        if old_value is not None:
            new_value = [rel.to_object.UID() for rel in old_value if not rel.isBroken()]
            for rel in old_value:
                relation_catalog.unindex(rel)
            obj.organisational_unit_reference = new_value
            logger.info(f"Updated organisational_unit_reference for {brain.getPath()}")
