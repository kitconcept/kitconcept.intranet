from kitconcept.intranet.vocabularies.base import TermWithUrl
from plone.restapi.interfaces import ISerializeToJson
from plone.restapi.serializer.vocabularies import SerializeTermToJson
from zope.component import adapter
from zope.interface import Interface
from zope.interface import implementer


@adapter(TermWithUrl, Interface)
@implementer(ISerializeToJson)
class SerializeTermWithUrlToJson(SerializeTermToJson):
    """Include URL in serialized term"""

    def __call__(self):
        result = super().__call__()
        result["url"] = self.context.url
        return result
