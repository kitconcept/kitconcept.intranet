from BTrees.OIBTree import OIBTree
from plone import api


def init_vocabulary_cache(context):
    """Initialize the vocabulary cache BTree on the portal."""
    portal = api.portal.get()
    if not hasattr(portal, "_vocab_cache"):
        portal._vocab_cache = OIBTree()
