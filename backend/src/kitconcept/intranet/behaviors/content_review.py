from kitconcept.intranet import _
from plone.autoform import directives
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from zope import schema
from zope.interface import provider


@provider(IFormFieldProvider)
class IContentReview(model.Schema):
    """Content Review behavior"""

    model.fieldset(
        "Content Review",
        label=_("label_review_fieldset", "Content Review"),
        fields=[
            "review_status",
            "review_interval",
            "review_due_date",
            "review_completed_date",
            "review_assignee",
        ],
    )

    review_status = schema.Choice(
        title=_("label_review_status", default="Review status"),
        values=("up-to-date", "due", "changes requested"),
        default="up-to-date",
        required=False,
        readonly=True,
    )

    review_interval = schema.Choice(
        title=_("label_review_interval", default="Review interval")
    )

    directives.widget(
        "review_interval",
        vocabulary="kitconcept.intranet.vocabularies.review_intervals",
        frontendOptions={
            "widget": "autocomplete",
            "widgetProps": {"isMulti": False},
        },
    )

    review_due_date = schema.Date(
        title=_("label_review_due_date", default="Review due date"),
        required=False,
    )

    review_completed_date = schema.Date(
        title=_("label_review_completed_date", default="Review completed date"),
        required=False,
        readonly=True,
    )

    review_assignee = schema.Tuple(
        title=_("label_review_assignee", default="Review assignee"),
        value_type=schema.TextLine(),
        required=False,
    )

    directives.widget(
        "review_assignee",
        vocabulary="kitconcept.intranet.vocabularies.review_users",
        frontendOptions={
            "widget": "autocomplete",
            "widgetProps": {"isMulti": False},
        },
    )
