"""Normalize task input and defer catalog writes until REST stores the page."""

from Acquisition import aq_base
from kitconcept.intranet.tasks.catalog import PENDING_KEY
from kitconcept.intranet.tasks.catalog import changes
from kitconcept.intranet.tasks.regions import plate_region
from kitconcept.intranet.tasks.values import stamp_task_metadata
from kitconcept.plate.regions import LEGACY_SOMERSAULT
from kitconcept.plate.regions import PLATE_TYPE
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
    """Preserve trusted task identity and timestamps while transforming a block.

    For the legacy ``__somersault__`` region; ``PlateTasksDeserializer`` handles
    the ``main`` region (``"@type": "plate"``).
    """

    order = 110
    block_type = LEGACY_SOMERSAULT
    disabled = False

    def __init__(self, context, request):
        self.context = context

    def __call__(self, block):
        # The stored region may still be the legacy one while the editor
        # already sends ``main``: the first save after the upgrade.
        _, existing = plate_region(getattr(self.context, "blocks", {}) or {})
        return stamp_task_metadata(self.context, block, existing=existing)


@adapter(Interface, IBrowserRequest)
@implementer(IBlockFieldDeserializationTransformer)
class PlateTasksDeserializer(TasksDeserializer):
    """The same for the ``main`` region, stored with ``"@type": "plate"``."""

    block_type = PLATE_TYPE


@adapter(IJSONField, IDexterityContent, IBrowserRequest)
@implementer(IFieldDeserializer)
class TaskBlocksDeserializer(BlocksJSONFieldDeserializer):
    """Capture task deltas at field level, including removal of the entire block."""

    def __call__(self, value):
        value = super().__call__(value)
        if self.field.getName() == "blocks":
            _, existing = plate_region(getattr(self.context, "blocks", {}) or {})
            # Apply after REST stores the field and finalizes the page path.
            # Request annotations prevent failed input from leaking into later saves.
            pending = IAnnotations(self.request).setdefault(PENDING_KEY, {})
            pending[aq_base(self.context)] = changes(existing, plate_region(value)[1])
        return value
