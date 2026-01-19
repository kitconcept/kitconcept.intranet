from plone.app.vocabularies.terms import safe_simplevocabulary_from_values
from Products.CMFCore.utils import getToolByName
from zope.component.hooks import getSite
from zope.interface import implementer
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleVocabulary


@implementer(IVocabularyFactory)
class ResponsibilitiesVocabulary:
    """Vocabulary factory listing all catalog keywords from the 'Responsibilities' index"""

    keyword_index = "responsibilities"

    def all_keywords(self, kwfilter):
        site = getSite()
        self.catalog = getToolByName(site, "portal_catalog", None)
        if self.catalog is None:
            return SimpleVocabulary([])
        index = self.catalog._catalog.getIndex(self.keyword_index)
        return safe_simplevocabulary_from_values(index._index, query=kwfilter)

    def __call__(self, context, query=None):
        return self.all_keywords(query)


ResponsibilitiesVocabularyFactory = ResponsibilitiesVocabulary()
