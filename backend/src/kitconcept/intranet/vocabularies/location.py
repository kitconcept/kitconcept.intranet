from plone import api
from zope.interface import provider
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary

import re


def slugify(text):
    """Replacing spaces and special characters with hyphens."""
    return re.sub(r"[^a-z0-9\-]", "", text.lower().replace(" ", "-"))


@provider(IVocabularyFactory)
def locations_vocabulary(context):
    """Vocabulary of Location objects"""
    catalog = api.portal.get_tool(name="portal_catalog")
    brains = catalog(portal_type="Location")

    terms = [
        SimpleTerm(
            value=brain.Title.strip(),
            token=slugify(brain.Title.strip()),
            title=brain.Title.strip(),
        )
        for brain in brains
    ]

    return SimpleVocabulary(terms)
