from kitconcept.intranet.interfaces import IBrowserLayer
from plone.restapi.types.adapters import JSONFieldSchemaProvider
from plone.restapi.types.interfaces import IJsonSchemaProvider
from plone.schema import IJSONField
from zope.component import adapter
from zope.interface import Interface
from zope.interface import implementer


@adapter(IJSONField, Interface, IBrowserLayer)
@implementer(IJsonSchemaProvider)
class CustomJSONFieldSchemaProvider(JSONFieldSchemaProvider):
    def get_schema(self):
        schema = super().get_schema()
        schema.update(self.field.json_schema)
        return schema
