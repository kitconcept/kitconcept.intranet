from BTrees.OIBTree import OIBTree
from plone import api
from plone.dexterity.content import DexterityContent
from plone.uuid.interfaces import IUUID
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary


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
    return SimpleVocabulary(terms)


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


class CatalogVocabulary(SimpleVocabulary):
    """Vocabulary supporting value validation against the Catalog."""

    def __contains__(self, value: DexterityContent | str) -> bool:
        """used during validation to make sure the selected item is found with
        the specified query.

        value can be either a string (hex value of uuid or path) or a plone
        content object.
        """
        if not isinstance(value, str):
            value = IUUID(value)
        if value.startswith("/"):
            # it is a path query
            site_path = "/".join(api.portal.get().getPhysicalPath())
            path = f"{site_path}{value}"
            query = {"path": {"query": path, "depth": 0}}
        else:
            # its a uuid
            query = {"UID": value}
        return bool(api.content.find(**query))


class BaseRelationVocabulary:
    """Base class for relation vocabularies"""

    portal_type: str

    def __init__(self, portal_type: str):
        self.portal_type = portal_type

    def query(self, context: DexterityContent) -> dict:
        return {
            "portal_type": self.portal_type,
            "sort_on": "sortable_title",
        }

    def prepare_title(self, result) -> str:
        return result.Title

    def __call__(
        self, context: DexterityContent, query: dict | None = None
    ) -> CatalogVocabulary:
        query = self.query(context)
        results = api.content.find(**query)
        terms = [
            SimpleTerm(result.getObject(), result.UID, self.prepare_title(result))
            for result in results
        ]
        return CatalogVocabulary(terms)


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
