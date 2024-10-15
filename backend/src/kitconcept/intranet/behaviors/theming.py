from kitconcept.intranet import _
from plone.autoform import directives
from plone.autoform.interfaces import IFormFieldProvider
from plone.namedfile.field import NamedBlobImage
from plone.supermodel import model
from zope.interface import provider
from zope.schema import TextLine


@provider(IFormFieldProvider)
class ITheming(model.Schema):
    """Site/Subsite theming properties behavior."""

    model.fieldset(
        "theming",
        fields=[
            "logo",
            "theme_color",
            "theme_high_contrast_color",
            "theme_font_color",
            "theme_low_contrast_font_color",
            "secondary_theme_color",
            "secondary_theme_high_contrast_color",
            "secondary_theme_font_color",
            "secondary_theme_low_contrast_font_color",
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

    directives.widget("theme_color", frontendOptions={"widget": "color"})
    theme_color = TextLine(
        title=_("label_theme_color", default="Theme Color"),
        required=False,
    )

    directives.widget("theme_high_contrast_color", frontendOptions={"widget": "color"})
    theme_high_contrast_color = TextLine(
        title=_("label_theme_high_contrast_color", default="High Contrast Color"),
        required=False,
    )

    directives.widget("theme_font_color", frontendOptions={"widget": "color"})
    theme_font_color = TextLine(
        title=_("label_theme_font_color", default="Font Color"),
        required=False,
    )

    directives.widget(
        "theme_low_contrast_font_color", frontendOptions={"widget": "color"}
    )
    theme_low_contrast_font_color = TextLine(
        title=_(
            "label_theme_low_contrast_font_color", default="Low Contrast Font Color"
        ),
        required=False,
    )

    directives.widget("secondary_theme_color", frontendOptions={"widget": "color"})
    secondary_theme_color = TextLine(
        title=_("label_secondary_theme_color", default="Secondary Theme Color"),
        required=False,
    )

    directives.widget(
        "secondary_theme_high_contrast_color", frontendOptions={"widget": "color"}
    )
    secondary_theme_high_contrast_color = TextLine(
        title=_(
            "label_secondary_theme_high_contrast_color",
            default="Secondary High Contrast Color",
        ),
        required=False,
    )

    directives.widget("secondary_theme_font_color", frontendOptions={"widget": "color"})
    secondary_theme_font_color = TextLine(
        title=_("label_secondary_theme_font_color", default="Secondary Font Color"),
        required=False,
    )

    directives.widget(
        "secondary_theme_low_contrast_font_color",
        frontendOptions={"widget": "color"},
    )
    secondary_theme_low_contrast_font_color = TextLine(
        title=_(
            "label_secondary_theme_low_contrast_font_color",
            default="Secondary Low Contrast Font Color",
        ),
        required=False,
    )
