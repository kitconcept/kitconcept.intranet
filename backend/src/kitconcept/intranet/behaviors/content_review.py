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
        title=_("label_review_status", default="Status"),
        values=("Up-to-date", "Due", "Changes requested"),
        default="Up-to-date",
        required=False,
        readonly=True,
    )

    review_interval = schema.List(
        title=_("label_review_interval", default="Interval"),
        value_type=schema.TextLine(),
        required=False,
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
        title=_("label_review_due_date", default="Due date"),
        required=False,
    )

    review_completed_date = schema.Date(
        title=_("label_review_completed_date", default="Completed date"),
        required=False,
        readonly=True,
    )

    review_assignee = schema.List(
        title=_("label_review_assignee", default="Assignee"),
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
