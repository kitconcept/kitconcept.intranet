from kitconcept.intranet import _
from plone.autoform.directives import order_after
from plone.autoform.directives import widget
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from z3c.relationfield.schema import RelationChoice
from z3c.relationfield.schema import RelationList
from zope.interface import provider


@provider(IFormFieldProvider)
class IOrganisationalUnitBehavior(model.Schema):
    """Behavior: Select a OrganisationalUnit from a vocabulary."""

    model.fieldset("categorization", fields=["organisational_unit_reference"])
    order_after(organisational_unit_reference="subjects")
    widget("organisational_unit_reference", frontendOptions={"widget": "select"})
    organisational_unit_reference = RelationList(
        title=_("Organisational Unit"),
        value_type=RelationChoice(
            vocabulary="kitconcept.intranet.vocabularies.organisational_unit_objects"
        ),
        required=False,
    )
