from kitconcept.intranet.vocabularies.base import CatalogVocabulary
from plone import api
from plone.dexterity.content import DexterityContent
from zope.interface import implementer
from zope.interface import provider
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary


@implementer(IVocabularyFactory)
class OrganisationalsUnitRelationVocabulary:
    """Vocabulary of available Organisationals Unit objects."""

    def query(self, context: DexterityContent) -> dict:
        """Query for Presenters."""
        return {
            "context": context,
            "portal_type": "Organisational Unit",
            "sort_on": "sortable_title",
        }

    @staticmethod
    def prepare_title(result) -> str:
        """Return a friendly value to be used in the vocabulary."""
        return result.Title

    def __call__(
        self, context: DexterityContent, query: dict | None = None
    ) -> CatalogVocabulary:
        query = self.query(context)
        results = api.content.find(**query)
        terms = []
        for result in results:
            title = self.prepare_title(result)
            terms.append(SimpleTerm(result.getObject(), result.UID, title))
        return CatalogVocabulary(terms)


OrganisationalsUnitRelationVocabularyFactory = OrganisationalsUnitRelationVocabulary()


@provider(IVocabularyFactory)
def organisational_unit_vocabulary(context: DexterityContent) -> SimpleVocabulary:
    """Returns a vocabulary with all Organisationals Unit objects."""
    brains = api.content.find(
        context=context, portal_type="Organisational Unit", sort_on="sortable_title"
    )
    terms: list[SimpleTerm] = []
    for brain in brains:
        terms.append(SimpleTerm(brain.UID, brain.UID, brain.Title))
    return SimpleVocabulary(terms)
