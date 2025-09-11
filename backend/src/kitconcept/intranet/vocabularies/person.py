from kitconcept.intranet import _
from kitconcept.intranet.vocabularies.base import BaseSimpleVocabulary
from plone.dexterity.content import DexterityContent
from zope.interface import provider
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary


@provider(IVocabularyFactory)
def persons_vocabulary(context):
    return BaseSimpleVocabulary("Person")(context)


TITLES = [
    ("Prof.", _("Prof.")),
    ("Dr.", _("Dr.")),
    ("Prof. Dr.", _("Prof. Dr.")),
]


@provider(IVocabularyFactory)
def academic_titles_vocabulary(context: DexterityContent) -> SimpleVocabulary:
    """Vocabulary factory for academic titles."""
    terms = []
    for token, title in TITLES:
        terms.append(SimpleTerm(token, token, title))
    return SimpleVocabulary(terms)
