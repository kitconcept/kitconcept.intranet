from kitconcept.intranet import _
from plone.autoform import directives
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from zope.interface import provider
from zope.schema import List
from zope.schema import TextLine


@provider(IFormFieldProvider)
class ILCM(model.Schema):
    """LCM behavior"""

    model.fieldset("LCM", fields=["authors", "responsible_person", "feedback_person"])

    directives.widget(
        "responsible_person",
        vocabulary="kitconcept.intranet.vocabularies.person",
        frontendOptions={
            "widgetProps": {
                "isMulti": False,
                "inheritedField": True,
            },
        },
    )
    responsible_person = TextLine(
        title=_("label_responsible", default="Content Owner:"),
        required=False,
    )

    directives.widget(
        "feedback_person",
        vocabulary="kitconcept.intranet.vocabularies.person",
        frontendOptions={
            "widget": "autocomplete",
            "widgetProps": {"isMulti": False},
        },
    )
    feedback_person = TextLine(
        title=_("label_feedback_person", default="Feedback to"),
        required=False,
    )

    directives.widget(
        "authors",
        vocabulary="kitconcept.intranet.vocabularies.person",
        frontendOptions={
            "widget": "autocomplete",
            "widgetProps": {"isMulti": True},
        },
    )
    authors = List(
        title=_("label_authors", default="Authors"),
        value_type=TextLine(),
        required=False,
    )
