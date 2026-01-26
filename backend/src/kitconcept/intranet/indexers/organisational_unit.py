from Acquisition import aq_base
from plone import api
from plone.dexterity.content import DexterityContent
from plone.dexterity.interfaces import IDexterityContent
from plone.indexer.decorator import indexer
from z3c.relationfield.relation import RelationValue


@indexer(IDexterityContent)
def organisational_unit_indexer(obj: DexterityContent) -> list[str]:
    """Indexer for organisational_unit_reference attribute from
    IOrganisationalUnitBehavior behavior."""

    base_obj = aq_base(obj)
    organisational_unit_reference: RelationValue | None = getattr(
        base_obj, "organisational_unit_reference", None
    )
    if organisational_unit_reference is None:
        # Don't store a value in the index
        raise AttributeError

    uids = []
    for ref in organisational_unit_reference:
        organisational_unit = ref.to_object
        uid = api.content.get_uuid(organisational_unit)
        uids.append(uid)
    return uids



@indexer(IDexterityContent)
def organisational_unit_label_indexer(obj: DexterityContent) -> list[str]:
    """Indexer for organisational_unit titles (for facet display)."""
    base_obj = aq_base(obj)
    organisational_unit_reference: RelationValue | None = getattr(
        base_obj, "organisational_unit_reference", None
    )
    if organisational_unit_reference is None:
        # Don't store a value in the index
        raise AttributeError

    labels = []
    for ref in organisational_unit_reference:
        organisational_unit = ref.to_object
        if organisational_unit:
            labels.append(organisational_unit.Title())
    return labels
