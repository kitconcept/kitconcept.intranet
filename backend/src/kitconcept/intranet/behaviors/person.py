from kitconcept.intranet import _
from plone.autoform.interfaces import IFormFieldProvider
from plone.autoform.directives import order_before
from plone.supermodel import model
from zope import schema
from zope.interface import provider


@provider(IFormFieldProvider)
class IPersonBehavior(model.Schema):
    """Behavior: Additional fields for a Person."""

    order_before(academic_title="first_name")
    academic_title = schema.Choice(
        title=_("Academic Title"),
        vocabulary="kitconcept.intranet.vocabularies.academic_titles",
        required=False,
    )

    job_title = schema.TextLine(
        title=_("Job Title"),
        required=False,
    )

    department = schema.TextLine(
        title=_("Department"),
        required=False,
    )
