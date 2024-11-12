from kitconcept.intranet import _
from plone.autoform import directives
from plone.autoform.interfaces import IFormFieldProvider
from plone.namedfile.field import NamedBlobImage
from plone.supermodel import model
from zope.interface import provider
from zope.schema import TextLine


messages = {
    "accent_color": {
        "default": "Fat menu background",
        "description": (
            "This is also the color used as accent color in buttons font text "
            "and for the breadcumbs background"
        ),
    },
    "accent_foreground_color": {
        "default": "Fat menu font color",
        "description": "This is also the color used in ...",
    },
    "primary_color": {
        "default": "Header background color (for dark themes)",
        "description": "If not set, the default color is used.",
    },
    "primary_foreground_color": {
        "default": "Navigation menu font color",
        "description": "This is also the color used in ...",
    },
    "secondary_color": {
        "default": "Footer background color",
        "description": "This is also the color used in ...",
    },
    "secondary_foreground_color": {
        "default": "Footer font color",
        "description": "This is also the color used in ...",
    },
}


@provider(IFormFieldProvider)
class ITheming(model.Schema):
    # @ericof, bring it back when it's ready
    # class ITheming(SettingsSchema):
    """Site/Subsite theming properties behavior."""

    model.fieldset(
        "theming",
        title="Theming",
        fields=[
            "logo",
            "accent_color",
            "accent_foreground_color",
            # "primary_color", # Not used in PiK
            "primary_foreground_color",
            "secondary_color",
            "secondary_foreground_color",
        ],
    )

    logo = NamedBlobImage(
        title=_("label_project_logo", default="Project Logo"),
        description=_(
            "help_project_logo",
            default="If the project has a logo, please upload it here.",
        ),
        required=False,
    )

    directives.widget("accent_color", frontendOptions={"widget": "themingColorPicker"})
    accent_color = TextLine(
        title=_("label_accent_color", default=messages["accent_color"]["default"]),
        description=_(
            "help_accent_color", default=messages["accent_color"]["description"]
        ),
        required=False,
    )

    directives.widget(
        "accent_foreground_color", frontendOptions={"widget": "themingColorPicker"}
    )
    accent_foreground_color = TextLine(
        title=_(
            "label_accent_foreground_color",
            default=messages["accent_foreground_color"]["default"],
        ),
        description=_(
            "help_accent_foreground_color",
            default=messages["accent_foreground_color"]["description"],
        ),
        required=False,
    )

    directives.widget(
        "primary_foreground_color", frontendOptions={"widget": "themingColorPicker"}
    )
    primary_foreground_color = TextLine(
        title=_(
            "label_primary_foreground_color",
            default=messages["primary_foreground_color"]["default"],
        ),
        description=_(
            "help_primary_foreground_color",
            default=messages["primary_foreground_color"]["description"],
        ),
        required=False,
    )

    directives.widget(
        "secondary_color", frontendOptions={"widget": "themingColorPicker"}
    )
    secondary_color = TextLine(
        title=_(
            "label_secondary_color", default=messages["secondary_color"]["default"]
        ),
        description=_(
            "help_secondary_color", default=messages["secondary_color"]["description"]
        ),
        required=False,
    )

    directives.widget(
        "secondary_foreground_color",
        frontendOptions={"widget": "themingColorPicker"},
    )
    secondary_foreground_color = TextLine(
        title=_(
            "label_secondary_foreground_color",
            default=messages["secondary_foreground_color"]["default"],
        ),
        description=_(
            "help_secondary_foreground_color",
            default=messages["secondary_foreground_color"]["description"],
        ),
        required=False,
    )
