from kitconcept.intranet import _
from plone.autoform.directives import read_permission
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import directives
from plone.supermodel import model
from zope import schema
from zope.interface import provider


PERMISSION = "kitconcept.intranet.behaviors.additional_contact_info.view"


@provider(IFormFieldProvider)
class IAdditionalContactInfo(model.Schema):
    directives.fieldset(
        "additional_contact_info",
        label=_(
            "label_additional_contact_info",
            default="Additional Contact Information",
        ),
        fields=("contact_building", "contact_room"),
    )

    read_permission(contact_building=PERMISSION, contact_room=PERMISSION)

    contact_building = schema.TextLine(
        title=_("label_contact_building", default="Building"),
        required=False,
    )

    contact_room = schema.TextLine(
        title=_("label_contact_room", default="Room"), required=False
    )
