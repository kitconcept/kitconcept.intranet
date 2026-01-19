from Acquisition import aq_base
from plone.dexterity.content import DexterityContent
from plone.dexterity.interfaces import IDexterityContent
from plone.indexer.decorator import indexer


@indexer(IDexterityContent)
def responsibilities_indexer(obj: DexterityContent) -> tuple[str, ...]:
    """Indexer for responsibilities attribute from IPersonBehavior.

    The responsibilities field is a Tuple of TextLine values (free-form tags).
    """
    base_obj = aq_base(obj)
    responsibilities: tuple[str, ...] | None = getattr(
        base_obj, "responsibilities", None
    )
    if not responsibilities:
        # Don't store a value in the index
        raise AttributeError

    return responsibilities
