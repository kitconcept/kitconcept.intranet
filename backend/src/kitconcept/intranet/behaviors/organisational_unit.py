from kitconcept.intranet import _
from plone.app.multilingual.dx.directives import languageindependent
from plone.autoform.directives import order_after
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from zope import schema
from zope.interface import provider


@provider(IFormFieldProvider)
class IOrganisationalUnitBehavior(model.Schema):
    """Behavior: Select OrganisationalUnits from a vocabulary."""

    model.fieldset("categorization", fields=["organisational_unit_reference"])
    order_after(organisational_unit_reference="subjects")
    languageindependent("organisational_unit_reference")
    organisational_unit_reference = schema.List(
        title=_("Organisational Unit"),
        value_type=schema.Choice(
            vocabulary="kitconcept.intranet.vocabularies.organisational_unit"
        ),
        required=False,
    )
