from kitconcept.intranet.vocabularies.base import BaseRelationVocabulary
from kitconcept.intranet.vocabularies.base import BaseSimpleVocabulary
from zope.interface import implementer
from zope.interface import provider
from zope.schema.interfaces import IVocabularyFactory


@implementer(IVocabularyFactory)
class LocationsRelationVocabulary(BaseRelationVocabulary):
    def __init__(self):
        super().__init__("Location")


LocationsRelationVocabularyFactory = LocationsRelationVocabulary()


@provider(IVocabularyFactory)
def locations_vocabulary(context):
    return BaseSimpleVocabulary("Location")(context)
