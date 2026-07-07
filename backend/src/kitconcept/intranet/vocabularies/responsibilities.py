from plone import api
from plone.app.vocabularies.terms import safe_simplevocabulary_from_values
from zope.interface import implementer
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleVocabulary


@implementer(IVocabularyFactory)
class ResponsibilitiesVocabulary:
    """Vocabulary factory listing all catalog keywords from the
    'Responsibilities' index"""

    keyword_index = "responsibilities"

    def all_keywords(self, kwfilter):

        if (catalog := api.portal.get_tool("portal_catalog")) is None:
            return SimpleVocabulary([])
        values = catalog.uniqueValuesFor(self.keyword_index)
        return safe_simplevocabulary_from_values(values, query=kwfilter)

    def __call__(self, context, query=None):
        return self.all_keywords(query)


ResponsibilitiesVocabularyFactory = ResponsibilitiesVocabulary()
