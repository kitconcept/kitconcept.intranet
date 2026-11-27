"""The Plate region that holds a page's body, in either shape.

kitconcept.plate 1.0.0a43 stores it in ``blocks["main"]`` with
``"@type": "plate"``; content not migrated yet keeps the legacy
``blocks["__somersault__"]``. See https://github.com/plone/aurora/issues/379.
"""

from kitconcept.plate.regions import LEGACY_SOMERSAULT
from kitconcept.plate.regions import MAIN_REGION
from kitconcept.plate.regions import get_plate_region
from kitconcept.plate.regions import is_plate_region


def plate_region(blocks) -> tuple[str | None, dict]:
    """Return ``(key, block)`` of the page body region, or ``(None, {})``.

    ``main`` wins over ``__somersault__``. The legacy key is accepted without
    an ``@type``, as older pages store it, so it is looked up by key first.
    """
    if not isinstance(blocks, dict):
        return None, {}
    if is_plate_region(blocks.get(MAIN_REGION)):
        return MAIN_REGION, blocks[MAIN_REGION]
    if isinstance(blocks.get(LEGACY_SOMERSAULT), dict):
        return LEGACY_SOMERSAULT, blocks[LEGACY_SOMERSAULT]
    key, block = get_plate_region(blocks)
    return key, block or {}
