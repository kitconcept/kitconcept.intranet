from kitconcept.intranet import _
from plone.autoform.interfaces import IFormFieldProvider
from plone.supermodel import model
from zope.interface import provider
from zope import schema


@provider(IFormFieldProvider)
class ICommentCount(model.Schema):

    comment_count = schema.Int(
        title=_("Comment Count"),
        description=_("Amount of Comments"),
        required=False,
        readonly=True,
        default=0,
    )
    has_deleted_comments = schema.Bool(
        title=_("Comments were deleted"),
        description=_("Indicates if comments were deleted"),
        required=False,
        readonly=True,
        default=False,
    )
