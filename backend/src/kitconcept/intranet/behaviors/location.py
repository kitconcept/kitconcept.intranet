from kitconcept.intranet import _
from plone.app.multilingual.dx.directives import languageindependent
from plone.autoform.directives import order_after
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from zope import schema
from zope.interface import provider


@provider(IFormFieldProvider)
class ILocationBehavior(model.Schema):
    """Behavior: Select Locations from a vocabulary."""

    model.fieldset("categorization", fields=["location_reference"])
    order_after(location_reference="subjects")
    languageindependent("location_reference")
    location_reference = schema.List(
        title=_("Location"),
        value_type=schema.Choice(
            vocabulary="kitconcept.intranet.vocabularies.location"
        ),
        required=False,
    )
