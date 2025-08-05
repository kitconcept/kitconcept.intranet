from plone import api
from plone.dexterity.content import DexterityContent
from plone.uuid.interfaces import IUUID
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary


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
            "context": context,
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
            context=context, portal_type=self.portal_type, sort_on="sortable_title"
        )
        terms = [SimpleTerm(brain.UID, brain.UID, brain.Title) for brain in brains]
        return SimpleVocabulary(terms)
