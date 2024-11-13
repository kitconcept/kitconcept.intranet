from kitconcept.intranet import _
from plone.autoform import directives
from plone.autoform.interfaces import IFormFieldProvider
from plone.namedfile.field import NamedBlobImage
from plone.supermodel import model
from zope.interface import provider
from zope.schema import TextLine


messages = {
    "accent_color": {
        "default": "Fat Menu Background Color",
    },
    "accent_foreground_color": {
        "default": "Fat Menu / Breadcrumbs Text Color",
    },
    "primary_color": {
        "default": "Header background color (for dark themes)",
    },
    "primary_foreground_color": {
        "default": "Navigation Text Color",
    },
    "secondary_color": {
        "default": "Footer Background Color",
    },
    "secondary_foreground_color": {
        "default": "Footer Font Color",
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
            "primary_foreground_color",
            "accent_foreground_color",
            "accent_color",
            # "primary_color", # Not used in PiK
            "secondary_foreground_color",
            "secondary_color",
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
        required=False,
    )

    directives.widget(
        "secondary_color", frontendOptions={"widget": "themingColorPicker"}
    )
    secondary_color = TextLine(
        title=_(
            "label_secondary_color", default=messages["secondary_color"]["default"]
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
        required=False,
    )
