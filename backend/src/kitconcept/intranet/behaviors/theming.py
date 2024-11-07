from kitconcept.intranet import _
from plone.autoform import directives
from plone.autoform.interfaces import IFormFieldProvider
from plone.namedfile.field import NamedBlobImage
from plone.supermodel import model
from plone.volto.sitesettings import SettingsSchema
from zope.interface import provider
from zope.schema import TextLine


@provider(IFormFieldProvider)
class ITheming(SettingsSchema):
    """Site/Subsite theming properties behavior."""

    model.fieldset(
        "theming",
        title="Theming",
        fields=[
            "logo",
            "accent_color",
            "accent_foreground_color",
            "primary_color",
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
        title=_("label_accent_color", default="Accent Color"),
        required=False,
    )

    directives.widget(
        "accent_foreground_color", frontendOptions={"widget": "themingColorPicker"}
    )
    accent_foreground_color = TextLine(
        title=_("label_accent_foreground_color", default="Accent Foreground Color"),
        required=False,
    )

    directives.widget("primary_color", frontendOptions={"widget": "themingColorPicker"})
    primary_color = TextLine(
        title=_("label_primary_color", default="Primary Color"),
        required=False,
    )

    directives.widget(
        "primary_foreground_color", frontendOptions={"widget": "themingColorPicker"}
    )
    primary_foreground_color = TextLine(
        title=_("label_primary_foreground_color", default="Primary Foreground Color"),
        required=False,
    )

    directives.widget(
        "secondary_color", frontendOptions={"widget": "themingColorPicker"}
    )
    secondary_color = TextLine(
        title=_("label_secondary_color", default="Secondary Color"),
        required=False,
    )

    directives.widget(
        "secondary_foreground_color",
        frontendOptions={"widget": "themingColorPicker"},
    )
    secondary_foreground_color = TextLine(
        title=_(
            "label_secondary_foreground_color",
            default="Secondary Foreground Color",
        ),
        required=False,
    )
