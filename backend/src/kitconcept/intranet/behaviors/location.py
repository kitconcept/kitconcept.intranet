from kitconcept.intranet import _
from plone.autoform.directives import order_after
from plone.autoform.directives import widget
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from z3c.relationfield.schema import RelationChoice
from z3c.relationfield.schema import RelationList
from zope.interface import provider


@provider(IFormFieldProvider)
class ILocationBehavior(model.Schema):
    """Behavior: Select a Location from a vocabulary."""

    model.fieldset("categorization", fields=["location_reference"])
    order_after(location_reference="subjects")
    widget("location_reference", frontendOptions={"widget": "select"})
    location_reference = RelationList(
        title=_("Location"),
        value_type=RelationChoice(
            vocabulary="kitconcept.intranet.vocabularies.location_objects"
        ),
        required=False,
    )
