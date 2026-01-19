from collective.person.interfaces import IPersonTitle
from kitconcept.intranet import _
from plone.app.z3cform.widgets.select import AjaxSelectFieldWidget
from plone.autoform import directives
from plone.autoform.directives import order_before
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from z3c.form.interfaces import IAddForm
from z3c.form.interfaces import IEditForm
from zope import schema
from zope.interface import alsoProvides
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

    # responsibilities fieldset
    model.fieldset(
        "responsability_categorization",
        label=_("label_schema_responsability_categorization", default="Responsibilities & Expertise"),
        fields=["responsibilities"],
    )

    responsibilities = schema.Tuple(
        title=_("label_responsibilities", default="Responsibilities"),
        description=_(
            "help_tags",
            default="Describe what others can contact you about. Focus on topics, tasks, or questions you are responsible for, such as advising on specific funding programs, supporting application processes, or clarifying formal requirements. Write in a way that allows colleagues without detailed organizational knowledge to understand whether you are the right contact.",
        ),
        value_type=schema.TextLine(),
        required=False,
        missing_value=(),
    )
    directives.widget(
        "responsibilities", AjaxSelectFieldWidget, vocabulary="kitconcept.intranet.vocabularies.responsibilities"
    )

    directives.omitted("responsibilities")
    directives.no_omit(IEditForm, "responsibilities")
    directives.no_omit(IAddForm, "responsibilities")


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
