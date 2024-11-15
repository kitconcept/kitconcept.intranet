from kitconcept.intranet.interfaces import IBrowserLayer
from plone.restapi.behaviors import IBlocks
from plone.restapi.blocks import iter_block_transform_handlers
from plone.restapi.blocks import visit_blocks
from plone.restapi.deserializer.dxfields import DefaultFieldDeserializer
from plone.restapi.interfaces import IBlockFieldDeserializationTransformer
from plone.restapi.interfaces import IFieldDeserializer
from plone.schema import IJSONField
from zope.component import adapter
from zope.interface import implementer


@implementer(IFieldDeserializer)
@adapter(IJSONField, IBlocks, IBrowserLayer)
class BlocksJSONFieldDeserializer(DefaultFieldDeserializer):
    def __call__(self, value):
        value = super().__call__(value)

        blocksValue = value.get("blocks", value)

        if self.field.getName() == "blocks" or "blocks" in value:
            for block in visit_blocks(self.context, blocksValue):
                new_block = block.copy()
                for handler in iter_block_transform_handlers(
                    self.context, block, IBlockFieldDeserializationTransformer
                ):
                    new_block = handler(new_block)
                block.clear()
                block.update(new_block)
        return value
