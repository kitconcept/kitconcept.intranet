from Acquisition import aq_base
from kitconcept.intranet.behaviors.organisational_unit import IOrganisationalUnitMarker
from plone import api
from plone.dexterity.content import DexterityContent
from plone.indexer.decorator import indexer
from z3c.relationfield.relation import RelationValue


@indexer(IOrganisationalUnitMarker)
def organisational_unit_indexer(obj: DexterityContent) -> str:
    """Indexer for organisational_unit_reference attribute from IOrganisationalUnitBehavior
    behavior."""

    base_obj = aq_base(obj)
    organisational_unit_reference: RelationValue | None = getattr(
        base_obj, "organisational_unit_reference", None
    )
    if organisational_unit_reference is None:
        return ""
    # A relation field
    organisational_unit = organisational_unit_reference.to_object
    uid = api.content.get_uuid(organisational_unit)
    return f"{uid}"
