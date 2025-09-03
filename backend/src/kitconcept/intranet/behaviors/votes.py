from kitconcept.intranet import _
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from zope.interface import provider
from zope import schema


@provider(IFormFieldProvider)
class IVotes(model.Schema):

    votes = schema.List(
        title=_("Votes"),
        description=_("List of user IDs"),
        value_type=schema.TextLine(
            title=_("Votes"),
        ),
        required=False,
        readonly=True,
    )
