from plone import api
from Products.CMFCore.utils import getToolByName
from zope.interface import provider
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary


@provider(IVocabularyFactory)
def creators_vocabulary(context) -> SimpleVocabulary:
    """Users who created content on this site.

    The unique ``Creator`` values of the catalog, with full names
    resolved where available. Data source for the search dialog's
    "Created by" filter chip (ticket 585): unlike the generic users
    vocabulary - which deliberately returns nothing without a search
    term - this lists exactly the users worth filtering by, and only
    reveals what search results expose anyway.
    """
    catalog = getToolByName(context, "portal_catalog")
    terms = []
    for userid in sorted(catalog.uniqueValuesFor("Creator")):
        if not userid:
            # imported content may carry an empty creator
            continue
        user = api.user.get(userid=userid)
        fullname = user.getProperty("fullname", "") if user else ""
        terms.append(SimpleTerm(userid, userid, fullname or userid))
    return SimpleVocabulary(terms)
