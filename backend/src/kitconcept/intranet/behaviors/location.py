from kitconcept.intranet import _
from plone.autoform.directives import order_after
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from z3c.relationfield.schema import RelationChoice
from zope.interface import provider


@provider(IFormFieldProvider)
class ILocationBehavior(model.Schema):
    """Behavior: Select a Location from a vocabulary."""

    model.fieldset("categorization", fields=["location_reference"])
    order_after(location_reference="subjects")
    location_reference = RelationChoice(
        title=_("Location"),
        vocabulary="kitconcept.intranet.vocabularies.location_objects",
        required=False,
    )
