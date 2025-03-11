from kitconcept.intranet import _
from plone.autoform import directives
from plone.autoform.interfaces import IFormFieldProvider
from plone.namedfile.field import NamedBlobImage
from plone.schema import JSONField
from plone.supermodel import model
from zope.interface import provider
from zope.schema import TextLine
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary

import json


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

BLOCKS_SCHEMA_DEFAULT_VALUE = {
    "blocks": {},
    "blocks_layout": {},
}

BLOCKS_SCHEMA = json.dumps({
    "type": "object",
    "properties": {
        "blocks": {"type": "object"},
        "blocks_layout": {"type": "object"},
    },
})

FONT_VOCABULARY = SimpleVocabulary([
    SimpleTerm(value="default", title=_("Default FZJ font")),
    SimpleTerm(value="impact-arialNarrow", title=_("Impact / Arial Narrow")),
    SimpleTerm(value="georgia-lucidaSans", title=_("Georgia / Lucida Sans")),
])


@provider(IFormFieldProvider)
class ISiteCustomizationSettings(model.Schema):
    # @ericof, bring it back when it's ready
    # class ISiteCustomizationSettings(SettingsSchema):
    """Site/Subsite theming properties behavior."""

    model.fieldset(
        "header",
        label=_("Header customizations"),
        fields=[
            "logo",
            "complementary_logo",
            "intranet_flag",
        ],
    )

    model.fieldset(
        "theming",
        label=_("Theming"),
        fields=[
            "primary_foreground_color",
            "accent_foreground_color",
            "accent_color",
            # "primary_color", # Not used in PiK
            "secondary_foreground_color",
            "secondary_color",
        ],
    )

    model.fieldset(
        "footer",
        label=_("Footer customizations"),
        fields=[
            "footer_links",
            "footer_logos",
            "footer_logos_container_width",
            "footer_logos_size",
        ],
    )

    logo = NamedBlobImage(
        title=_("label_site_logo", default="Site Logo"),
        description=_(
            "help_site_logo",
            default="If the site or subsite has a logo, please upload it here.",
        ),
        required=False,
    )

    complementary_logo = NamedBlobImage(
        title=_("label_complementary_logo", default="Complementary Logo"),
        description=_(
            "help_complementary_logo",
            default="If the project has a complimentary logo, please upload it here. "
            "It will show in the right side of the header",
        ),
        required=False,
    )

    intranet_flag = TextLine(
        title=_("label_intranet_flag", default="Intranet Flag"),
        description=_(
            "help_intranet_flag",
            default="If your site is an intranet, the intranet flag is the color pill"
            " at the top left of the header.",
        ),
        required=False,
    )

    directives.widget("accent_color", frontendOptions={"widget": "themeColorPicker"})
    accent_color = TextLine(
        title=_("label_accent_color", default=messages["accent_color"]["default"]),
        required=False,
    )

    directives.widget(
        "accent_foreground_color", frontendOptions={"widget": "themeColorPicker"}
    )
    accent_foreground_color = TextLine(
        title=_(
            "label_accent_foreground_color",
            default=messages["accent_foreground_color"]["default"],
        ),
        required=False,
    )

    directives.widget(
        "primary_foreground_color", frontendOptions={"widget": "themeColorPicker"}
    )
    primary_foreground_color = TextLine(
        title=_(
            "label_primary_foreground_color",
            default=messages["primary_foreground_color"]["default"],
        ),
        required=False,
    )

    directives.widget("secondary_color", frontendOptions={"widget": "themeColorPicker"})
    secondary_color = TextLine(
        title=_(
            "label_secondary_color", default=messages["secondary_color"]["default"]
        ),
        required=False,
    )

    directives.widget(
        "secondary_foreground_color",
        frontendOptions={"widget": "themeColorPicker"},
    )
    secondary_foreground_color = TextLine(
        title=_(
            "label_secondary_foreground_color",
            default=messages["secondary_foreground_color"]["default"],
        ),
        required=False,
    )

    directives.widget("footer_logos", frontendOptions={"widget": "footerLogos"})
    footer_logos = JSONField(
        title=_("Footer logos"),
        schema=BLOCKS_SCHEMA,
        default=BLOCKS_SCHEMA_DEFAULT_VALUE,
        required=False,
        widget="",
    )

    directives.widget(
        "footer_logos_container_width",
        frontendOptions={
            "widget": "blockWidth",
            "widgetProps": {
                "filterActions": ["default", "layout"],
                "actions": [
                    {
                        "name": "default",
                        "label": "Default",
                    },
                    {
                        "name": "layout",
                        "label": "Layout",
                    },
                ],
            },
        },
    )
    footer_logos_container_width = TextLine(
        title=_("Footer logos container width"),
        default="default",
        required=False,
    )

    directives.widget(
        "footer_logos_size",
        frontendOptions={
            "widget": "sizeWidget",
            "widgetProps": {"filterActions": ["s", "l"]},
        },
    )
    footer_logos_size = TextLine(
        title=_("Footer logos size"),
        default="s",
        required=False,
    )

    directives.widget("footer_links", frontendOptions={"widget": "footerLinks"})
    footer_links = JSONField(
        title=_("Footer links"),
        schema=BLOCKS_SCHEMA,
        default=BLOCKS_SCHEMA_DEFAULT_VALUE,
        required=False,
        widget="",
    )
