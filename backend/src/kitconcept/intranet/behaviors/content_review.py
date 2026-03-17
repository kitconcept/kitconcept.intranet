from datetime import date
from kitconcept.intranet import _
from plone import api
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from zope import schema
from zope.interface import Invalid
from zope.interface import invariant
from zope.interface import provider
from zope.schema.interfaces import IContextAwareDefaultFactory


@provider(IContextAwareDefaultFactory)
def default_review_interval(context) -> str:
    record = api.portal.get_registry_record(
        "kitconcept.intranet.content_review_default_interval"
    )
    if record is None:
        # TODO: maybe send an email that a default has to be set?
        pass
    return record


@provider(IFormFieldProvider)
class IContentReview(model.Schema):
    """Content Review behavior"""

    model.fieldset(
        "Content Review & Reminders",
        label=_("label_review_fieldset", "Content Review & Reminders"),
        fields=[
            "review_enabled",
            "review_status",
            "review_interval",
            "review_assignee",
            "review_due_date",
            "review_completed_date",
        ],
    )

    review_enabled = schema.Bool(
        title=_(
            "label_review_enabled",
            default="Timeless content - exclude from review reminders",
        ),
        required=False,
        default=False,
    )

    review_status = schema.Choice(
        title=_("label_review_status", default="Status"),
        values=("Up-to-date", "Due", "Changes requested"),
        default="Up-to-date",
        required=False,
        readonly=True,
    )

    review_interval = schema.Choice(
        title=_("label_review_interval", default="Review Interval"),
        vocabulary="kitconcept.intranet.vocabularies.content_review_intervals",
        required=False,
        defaultFactory=default_review_interval,
    )

    review_assignee = schema.Choice(
        title=_("label_review_assignee", default="Reviewer"),
        description=_(
            "help_review_assignee",
            default="... will be notified as soon as the review is due. Unless otherwise specified, the content owner is considered the responsible person.",
        ),
        vocabulary="plone.app.vocabularies.Users",
        required=False,
    )

    review_due_date = schema.Date(
        title=_("label_review_due_date", default="Due date"),
        default=date.today(),
        required=False,
    )

    review_completed_date = schema.Date(
        title=_("label_review_completed_date", default="Completed date"),
        required=False,
        readonly=True,
    )

    review_comment = schema.Text(
        title=_("label_review_comment", default="Comment"),
        required=False,
        readonly=True,
    )

    @invariant
    def validate_due_date_field(data):
        is_reviewable = getattr(data, "review_enabled", False)
        has_due_date = getattr(data, "review_due_date", None)
        if not is_reviewable and not has_due_date:
            raise Invalid("You have to set a due date if the content is not timeless")
        elif is_reviewable and has_due_date:
            raise Invalid("Cannot set due date if content is timeless")
