from kitconcept.intranet import _
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from zope.interface import provider
from zope.schema import Choice
from zope.schema import TextLine


@provider(IFormFieldProvider)
class ITheming(model.Schema):
    """Site/Subsite theming properties behavior."""

    model.fieldset(
        "theming",
        fields=[
            # "theme",
            "color1",
            "color2",
            "color3",
            "color4",
        ],
    )

    # theme = Choice(
    #     title=_("label_theme", default="Theme"),
    #     description=_(
    #         "label_theme_description",
    #         default="Defines the theme (color, etc...) used in this subsite",
    #     ),
    #     vocabulary="kitconcept.internet.vocabulary.themes",
    #     required=False,
    # )

    color1 = TextLine(
        title=_("label_color1", default="Color 1"),
        required=False,
    )

    color2 = TextLine(
        title=_("label_color2", default="Color 2"),
        required=False,
    )

    color3 = TextLine(
        title=_("label_color3", default="Color 3"),
        required=False,
    )

    color4 = TextLine(
        title=_("label_color4", default="Color 4"),
        required=False,
    )
