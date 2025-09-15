from kitconcept.intranet import _
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from zope import schema
from zope.interface import provider


@provider(IFormFieldProvider)
class IEnableLikes(model.Schema):
    enable_likes = schema.Bool(
        title=_("Enable Likes"),
        description=_("Enable Likes for this Content Object"),
        required=False,
        default=True,
    )
