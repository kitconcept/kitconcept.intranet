from kitconcept.intranet.vocabularies.base import BaseSimpleVocabulary
from zope.interface import provider
from zope.schema.interfaces import IVocabularyFactory


@provider(IVocabularyFactory)
def persons_vocabulary(context):
    return BaseSimpleVocabulary("Person")(context)
