from kitconcept.intranet import _
from plone.autoform.interfaces import IFormFieldProvider
from z3c.relationfield.relation import RelationValue
from z3c.relationfield.schema import RelationChoice
from zope.interface import Interface
from zope.interface import implementer
from zope.interface import provider


class IOrganisationalUnitMarker(Interface):
    """Marker interface for content items that use IOrganisationalUnitBehavior behavior."""


@provider(IFormFieldProvider)
class IOrganisationalUnitBehavior(IOrganisationalUnitMarker):
    """Behavior: Select a OrganisationalUnit from a vocabulary."""

    organisational_unit_reference = RelationChoice(
        title=_("Organisational Unit"),
        vocabulary="kitconcept.intranet.vocabularies.organisational_unit_objects",
        required=False,
    )


@implementer(IOrganisationalUnitBehavior)
class OrganisationalUnitAdapter:
    """Behavior class for OrganisationalUnit."""

    def __init__(self, context):
        self.context = context

    @property
    def organisational_unit_reference(self) -> RelationValue | None:
        return self.context.organisational_unit_reference

    @organisational_unit_reference.setter
    def organisational_unit_reference(self, value: RelationValue | None):
        self.context.organisational_unit_reference = value
