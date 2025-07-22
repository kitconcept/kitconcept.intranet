from kitconcept.voltolighttheme import _
from plone.autoform import directives
from plone.autoform.interfaces import IFormFieldProvider
from plone.schema import JSONField
from plone.supermodel import model
from zope.interface import provider

import json


OBJECT_DEFAULT_VALUE = {}

OBJECT = json.dumps({
    "type": "object",
})


@provider(IFormFieldProvider)
class ITTWBlocksSettings(model.Schema):
    """Through The Web blocks configuration."""

    model.fieldset(
        "blocksconfiguration",
        label=_("Blocks configuration"),
        fields=[
            "blocks_config_mutator",
        ],
    )

    directives.widget(
        "blocks_config_mutator",
        frontendOptions={
            "widget": "blockConfigEditor",
        },
    )
    blocks_config_mutator = JSONField(
        title=_("Blocks configuration"),
        description=_(
            "help_blocks_config_mutator",
            default="Configure some aspects of the default blocks configuration.",
        ),
        schema=OBJECT,
        default=OBJECT_DEFAULT_VALUE,
        required=False,
        widget="",
    )
