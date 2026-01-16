from Acquisition import aq_base
from plone.dexterity.content import DexterityContent
from plone.dexterity.interfaces import IDexterityContent
from plone.indexer.decorator import indexer


@indexer(IDexterityContent)
def responsabilities_indexer(obj: DexterityContent) -> tuple[str, ...]:
    """Indexer for responsabilities attribute from IPersonBehavior.

    The responsabilities field is a Tuple of TextLine values (free-form tags).
    """
    base_obj = aq_base(obj)
    responsabilities: tuple[str, ...] | None = getattr(
        base_obj, "responsabilities", None
    )
    if not responsabilities:
        # Don't store a value in the index
        raise AttributeError

    return responsabilities