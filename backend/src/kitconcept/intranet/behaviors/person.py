from collective.person.interfaces import IPersonTitle
from kitconcept.intranet import _
from kitconcept.intranet.deserializers.responsabilities import IResponsabilitiesField
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

    # Responsabilities fieldset
    model.fieldset(
        "responsability_categorization",
        label=_("label_schema_responsability_categorization", default="Responsabilities & Expertise"),
        fields=["responsabilities"],
    )

    responsabilities = schema.Tuple(
        title=_("label_responsabilities", default="Responsabilities"),
        description=_(
            "help_tags",
            default="Describe what others can contact you about. Focus on topics, tasks, or questions you are responsible for, such as advising on specific funding programs, supporting application processes, or clarifying formal requirements. Write in a way that allows colleagues without detailed organizational knowledge to understand whether you are the right contact.",
        ),
        value_type=schema.TextLine(),
        required=False,
        missing_value=(),
    )
    directives.widget(
        "responsabilities", AjaxSelectFieldWidget, vocabulary="kitconcept.intranet.vocabularies.responsabilities"
    )

    directives.omitted("responsabilities")
    directives.no_omit(IEditForm, "responsabilities")
    directives.no_omit(IAddForm, "responsabilities")


# Tag the responsabilities field with the marker interface for the custom deserializer
alsoProvides(IPersonBehavior["responsabilities"], IResponsabilitiesField)


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
