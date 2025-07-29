from Acquisition import aq_base
from kitconcept.intranet.behaviors.location import ILocationMarker
from plone import api
from plone.dexterity.content import DexterityContent
from plone.indexer.decorator import indexer
from z3c.relationfield.relation import RelationValue


@indexer(ILocationMarker)
def location_indexer(obj: DexterityContent) -> str:
    """Indexer for location attribute from ILocation behavior."""
    base_obj = aq_base(obj)
    location: RelationValue | None = getattr(base_obj, "location", None)
    if location is None:
        return ""
    # A relation field
    location_obj = location.to_object
    uid = api.content.get_uuid(location_obj)
    return f"{uid}"
