from collective.person.content.person import IPerson
from kitconcept.intranet.interfaces import IBrowserLayer
from plone import api
from plone.restapi.interfaces import ISerializeToJson
from plone.restapi.serializer.dxcontent import SerializeToJson
from zope.component import adapter
from zope.interface import implementer


@implementer(ISerializeToJson)
@adapter(IPerson, IBrowserLayer)
class PersonSerializer(SerializeToJson):
    """Custom serializer for Person content type."""

    def __call__(self, **kwargs):
        result = super().__call__(**kwargs)

        location_vocab = api.portal.get_vocabulary(
            "kitconcept.intranet.vocabularies.location", self.context
        )
        organisational_unit_vocab = api.portal.get_vocabulary(
            "kitconcept.intranet.vocabularies.organisational_unit", self.context
        )

        locations = []
        for value in getattr(self.context, "location_reference", None) or []:
            term = location_vocab.by_value.get(value)
            if term is not None:
                locations.append(term.title)
        result["locations"] = locations

        org_units = []
        for value in getattr(self.context, "organisational_unit_reference", None) or []:
            term = organisational_unit_vocab.by_value.get(value)
            if term is not None:
                org_units.append(term.title)
        result["organisational_units"] = org_units
        return result
