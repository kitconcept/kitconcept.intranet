from kitconcept.intranet import _
from zope.interface import provider
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary


INTERVALS = [
    ("3m", _("Every 3 months")),
    ("6m", _("Every 6 months")),
    ("1y", _("Every year")),
    ("2y", _("Every 2 years")),
]


@provider(IVocabularyFactory)
def review_intervals_vocabulary(context) -> SimpleVocabulary:
    terms = []
    for token, title in INTERVALS:
        terms.append(SimpleTerm(token, token, title))
    return SimpleVocabulary(terms)


@provider(IVocabularyFactory)
def review_users_vocabulary(context):
    acl_users = context.acl_users
    reviewers = acl_users.getGroupById("Reviewers")
    return reviewers.getMemberIds()
