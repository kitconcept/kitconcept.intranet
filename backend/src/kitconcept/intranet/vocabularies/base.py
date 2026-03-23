from BTrees.OIBTree import OIBTree
from plone import api
from plone.dexterity.content import DexterityContent
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary


class RelaxedSimpleVocabulary(SimpleVocabulary):
    """Like SimpleVocabulary, but don't fail validation.

    This helps during initial import, when referenced items might not exist yet.
    """

    def __contains__(self, value):
        return True


def get_translated_vocabulary(params: tuple, language: str) -> SimpleVocabulary:
    """Return a SimpleVocabulary with ordered terms by title."""
    default_language = api.portal.get_default_language()
    query = dict(params)
    query["Language"] = default_language
    brains = api.content.find(**query)
    terms_by_translation_group = {}
    terms_by_token = {}
    for brain in brains:
        uid = brain.UID
        term = SimpleTerm(
            value=uid,
            token=uid,
            title=brain.Title,
        )
        translation_group = getattr(brain, "TranslationGroup", None)
        if translation_group:
            terms_by_translation_group[translation_group] = term
        terms_by_token[uid] = term

    # update terms with translated titles
    if language != default_language and terms_by_translation_group:
        for brain in api.content.find(
            Language=language,
            TranslationGroup=tuple(terms_by_translation_group.keys()),
        ):
            translation_group = getattr(brain, "TranslationGroup", None)
            if translation_group and translation_group in terms_by_translation_group:
                terms_by_translation_group[translation_group].title = brain.Title

    terms = sorted(terms_by_token.values(), key=lambda term: term.title)
    return RelaxedSimpleVocabulary(terms)


class VocabularyCounter:
    """Helps invalidate vocabulary caches across instances."""

    def __init__(self):
        self.portal = api.portal.get()
        self._init_cache()

    def _init_cache(self):
        # Initialize a BTree in the portal's _vocab_cache attribute.
        # This is used to increment a counter when a vocab is updated.
        if not hasattr(self.portal, "_vocab_cache"):
            self.portal._vocab_cache = OIBTree()
        self.cache = self.portal._vocab_cache

    def get(self, vocab: str):
        """Get the current counter value for vocab"""
        return self.cache.get(vocab, 0)

    def invalidate(self, vocab: str):
        """Increment the counter for vocab"""
        self.cache[vocab] = self.get(vocab) + 1


def get_vocabulary_counter(vocab: str):
    """Get the current counter value for vocab"""
    return VocabularyCounter().get(vocab)


def invalidate_vocabulary_cache(vocab: str):
    """Invalidate the cache for vocab"""
    VocabularyCounter().invalidate(vocab)


class BaseSimpleVocabulary:
    """Base class for simple UID-Title vocabularies."""

    portal_type: str

    def __init__(self, portal_type: str):
        self.portal_type = portal_type

    def __call__(self, context: DexterityContent) -> SimpleVocabulary:
        brains = api.content.find(
            portal_type=self.portal_type, sort_on="sortable_title"
        )
        terms = [SimpleTerm(brain.UID, brain.UID, brain.Title) for brain in brains]
        return SimpleVocabulary(terms)
