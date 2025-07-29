from kitconcept.intranet import _
from plone.autoform.interfaces import IFormFieldProvider
from z3c.relationfield.relation import RelationValue
from z3c.relationfield.schema import RelationChoice
from zope.interface import Interface
from zope.interface import implementer
from zope.interface import provider


class ILocationMarker(Interface):
    """Marker interface for content items that use ILocationBehavior behavior."""


@provider(IFormFieldProvider)
class ILocationBehavior(ILocationMarker):
    """Behavior: Select a Location from a vocabulary."""

    location = RelationChoice(
        title=_("Location"),
        vocabulary="kitconcept.intranet.vocabularies.location_objects",
        required=False,
    )


@implementer(ILocationBehavior)
class LocationAdapter:
    """Behavior class for location."""

    def __init__(self, context):
        self.context = context

    @property
    def location(self) -> RelationValue | None:
        return self.context.location

    @location.setter
    def location(self, value: RelationValue | None):
        self.context.location = value
