from plone.app.contenttypes.interfaces import IEvent
from kitconcept.intranet.interfaces import IBrowserLayer
from plone.restapi.interfaces import ISerializeToJson
from zope.component import adapter
from zope.interface import implementer
from plone.restapi.serializer.dxcontent import SerializeToJson
from plone.restapi.serializer.converters import json_compatible
from plone import api
from zope.component import getMultiAdapter


@implementer(ISerializeToJson)
@adapter(IEvent, IBrowserLayer)
class EventSerializer(SerializeToJson):
    """Custom serializer for Event content type."""

    def __call__(self, **kwargs):
        result = super().__call__(**kwargs)

        location_vocab = api.portal.get_vocabulary(
            "kitconcept.intranet.vocabularies.location", self.context
        )

        locations = []
        for value in getattr(self.context, "location_reference", None) or []:
            term = location_vocab.by_value.get(value)
            if term is not None:
                serializer = getMultiAdapter((term, None), ISerializeToJson)
                locations.append(serializer())
        result["locations"] = json_compatible(locations)

        return result
