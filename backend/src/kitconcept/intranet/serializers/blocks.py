from kitconcept.intranet.interfaces import IBrowserLayer
from plone.restapi.behaviors import IBlocks
from plone.restapi.blocks import iter_block_transform_handlers
from plone.restapi.blocks import visit_blocks
from plone.restapi.interfaces import IBlockFieldSerializationTransformer
from plone.restapi.interfaces import IFieldSerializer
from plone.restapi.serializer.converters import json_compatible
from plone.restapi.serializer.dxfields import DefaultFieldSerializer
from plone.schema import IJSONField
from zope.component import adapter
from zope.interface import implementer

import copy


@adapter(IJSONField, IBlocks, IBrowserLayer)
@implementer(IFieldSerializer)
class BlocksJSONFieldSerializer(DefaultFieldSerializer):
    def __call__(self):
        value = copy.deepcopy(self.get_value())

        if "blocks" in value:
            blocksValue = value["blocks"]
        else:
            blocksValue = value

        if self.field.getName() == "blocks" or "blocks" in value:
            for block in visit_blocks(self.context, blocksValue):
                new_block = block.copy()
                for handler in iter_block_transform_handlers(
                    self.context, block, IBlockFieldSerializationTransformer
                ):
                    new_block = handler(new_block)
                block.clear()
                block.update(new_block)
        return json_compatible(value)
