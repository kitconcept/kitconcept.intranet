from kitconcept.intranet.vocabularies.base import BaseRelationVocabulary
from kitconcept.intranet.vocabularies.base import BaseSimpleVocabulary
from zope.interface import implementer
from zope.interface import provider
from zope.schema.interfaces import IVocabularyFactory


@implementer(IVocabularyFactory)
class OrganisationalUnitRelationVocabulary(BaseRelationVocabulary):
    def __init__(self):
        super().__init__("Organisational Unit")


OrganisationalsUnitRelationVocabularyFactory = OrganisationalUnitRelationVocabulary()


@provider(IVocabularyFactory)
def organisational_unit_vocabulary(context):
    return BaseSimpleVocabulary("Organisational Unit")(context)
