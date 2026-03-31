from kitconcept.intranet import cache
from kitconcept.intranet.vocabularies.base import get_translated_vocabulary
from plone import api
from zope.interface import provider
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleVocabulary


@cache.ram(cache.vocabulary_key("kitconcept.intranet.vocabularies.organisational_unit"))
def get_vocab(path, language: str) -> SimpleVocabulary:
    """Get the vocabulary."""
    params = (("portal_type", "Organisational Unit"),)
    return get_translated_vocabulary(params, language)


@provider(IVocabularyFactory)
def organisational_unit_vocabulary(context) -> SimpleVocabulary:
    """Vocabulary of available Organisational Units"""
    language = api.portal.get_current_language(context=context)
    return get_vocab(None, language)
