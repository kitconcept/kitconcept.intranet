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
            "accent_color",
            "accent_foreground_color",
            "theme_color",
            "theme_foreground_color",
            "theme_high_contrast_color",
            "theme_low_contrast_foreground_color",
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

    directives.widget("theme_color", frontendOptions={"widget": "themingColorPicker"})
    theme_color = TextLine(
        title=_("label_theme_color", default="Primary Color"),
        required=False,
    )

    directives.widget(
        "theme_foreground_color", frontendOptions={"widget": "themingColorPicker"}
    )
    theme_foreground_color = TextLine(
        title=_("label_theme_foreground_color", default="Primary Foreground Color"),
        required=False,
    )

    directives.widget(
        "theme_high_contrast_color", frontendOptions={"widget": "themingColorPicker"}
    )
    theme_high_contrast_color = TextLine(
        title=_("label_theme_high_contrast_color", default="High Contrast Color"),
        required=False,
    )

    directives.widget(
        "theme_low_contrast_foreground_color",
        frontendOptions={"widget": "themingColorPicker"},
    )
    theme_low_contrast_foreground_color = TextLine(
        title=_(
            "label_theme_low_contrast_foreground_color",
            default="Low Contrast Foreground Color",
        ),
        required=False,
    )

    # directives.widget(
    #     "theme_color_secondary", frontendOptions={"widget": "themingColorPicker"}
    # )
    # theme_color_secondary = TextLine(
    #     title=_("label_theme_color_secondary", default="Secondary Theme Color"),
    #     required=False,
    # )

    # directives.widget(
    #     "theme_high_contrast_color_secondary",
    #     frontendOptions={"widget": "themingColorPicker"},
    # )
    # theme_high_contrast_color_secondary = TextLine(
    #     title=_(
    #         "label_theme_high_contrast_color_secondary",
    #         default="Secondary High Contrast Color",
    #     ),
    #     required=False,
    # )

    # directives.widget(
    #     "theme_font_color_secondary", frontendOptions={"widget": "themingColorPicker"}
    # )
    # theme_font_color_secondary = TextLine(
    #     title=_("label_theme_font_color_secondary", default="Secondary Font Color"),
    #     required=False,
    # )

    # directives.widget(
    #     "theme_low_contrast_font_color_secondary",
    #     frontendOptions={"widget": "themingColorPicker"},
    # )
    # theme_low_contrast_font_color_secondary = TextLine(
    #     title=_(
    #         "label_theme_low_contrast_font_color_secondary",
    #         default="Secondary Low Contrast Font Color",
    #     ),
    #     required=False,
    # )
