from collective.person.interfaces import IPersonTitle
from kitconcept.intranet import _
from plone.autoform.directives import order_before
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from zope import schema
from zope.interface import implementer
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

    department = schema.Text(
        title=_("Department"),
        required=False,
    )


@implementer(IPersonTitle)
class AcademicTitleFirstLastName:
    """Return the title with 'academic_title first_name last_name'."""

    name: str = _("Academic Title, First and Last Name")

    def title(self, context) -> str:
        """Return the title of the person."""
        parts = [
            (context.academic_title or "").strip(),
            (context.first_name or "").strip(),
            (context.last_name or "").strip(),
        ]
        return " ".join([part for part in parts if part])
