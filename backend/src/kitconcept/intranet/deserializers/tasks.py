"""Normalize task input and defer catalog writes until REST stores the page."""

from Acquisition import aq_base
from kitconcept.intranet.tasks.catalog import PENDING_KEY
from kitconcept.intranet.tasks.catalog import changes
from kitconcept.intranet.tasks.values import stamp_task_metadata
from plone.dexterity.interfaces import IDexterityContent
from plone.restapi.deserializer.blocks import BlocksJSONFieldDeserializer
from plone.restapi.interfaces import IBlockFieldDeserializationTransformer
from plone.restapi.interfaces import IFieldDeserializer
from plone.schema import IJSONField
from zope.annotation.interfaces import IAnnotations
from zope.component import adapter
from zope.interface import Interface
from zope.interface import implementer
from zope.publisher.interfaces.browser import IBrowserRequest


@adapter(Interface, IBrowserRequest)
@implementer(IBlockFieldDeserializationTransformer)
class TasksDeserializer:
    """Preserve trusted task identity and timestamps while transforming a block."""

    order = 110
    block_type = "__somersault__"
    disabled = False

    def __init__(self, context, request):
        self.context = context

    def __call__(self, block):
        existing = (getattr(self.context, "blocks", {}) or {}).get("__somersault__", {})
        return stamp_task_metadata(self.context, block, existing=existing)


@adapter(IJSONField, IDexterityContent, IBrowserRequest)
@implementer(IFieldDeserializer)
class TaskBlocksDeserializer(BlocksJSONFieldDeserializer):
    """Capture task deltas at field level, including removal of the entire block."""

    def __call__(self, value):
        value = super().__call__(value)
        if self.field.getName() == "blocks":
            existing = (getattr(self.context, "blocks", {}) or {}).get(
                "__somersault__", {}
            )
            # Apply after REST stores the field and finalizes the page path.
            # Request annotations prevent failed input from leaking into later saves.
            pending = IAnnotations(self.request).setdefault(PENDING_KEY, {})
            pending[aq_base(self.context)] = changes(
                existing, value.get("__somersault__", {})
            )
        return value
