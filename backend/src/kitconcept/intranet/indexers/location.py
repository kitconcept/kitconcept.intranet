from Acquisition import aq_base
from plone import api
from plone.dexterity.content import DexterityContent
from plone.dexterity.interfaces import IDexterityContent
from plone.indexer.decorator import indexer
from z3c.relationfield.relation import RelationValue


@indexer(IDexterityContent)
def location_indexer(obj: DexterityContent) -> list[str]:
    """Indexer for location attribute from ILocation behavior."""
    base_obj = aq_base(obj)
    location_reference: RelationValue | None = getattr(
        base_obj, "location_reference", None
    )
    if location_reference is None:
        # Don't store a value in the index
        raise AttributeError

    uids = []
    for ref in location_reference:
        location = ref.to_object
        uid = api.content.get_uuid(location)
        uids.append(uid)
    return uids
