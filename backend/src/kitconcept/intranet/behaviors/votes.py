from kitconcept.intranet import _
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from zope import schema
from zope.interface import provider


@provider(IFormFieldProvider)
class IVotes(model.Schema):
    model.fieldset("likes", label=_("Likes"), fields=["votes", "enable_likes"])

    votes = schema.List(
        title=_("Votes"),
        description=_("List of user IDs"),
        value_type=schema.TextLine(
            title=_("Votes"),
        ),
        required=False,
        readonly=True,
    )

    enable_likes = schema.Bool(
        title=_("Enable Likes"),
        description=_("Enable Likes for this Content Object"),
        required=False,
        default=False,
    )
