"""Watch content: users who get an email when a content item changes.

The user IDs are stored in an annotation, not in a schema field, so they are
not part of the content serialization: users must not see who else watches
an item. A user only learns whether they watch an item themselves, through
the ``@watch`` service.

The IDs live in an ``OOTreeSet``. It resolves concurrent additions of
different users, and plone.app.iterate hands the same set to the working
copy and back to the baseline on check-in, so watchers survive a checkout.
"""

from BTrees.OOBTree import OOTreeSet
from zope.annotation.interfaces import IAnnotations
from zope.component import adapter
from zope.interface import Interface
from zope.interface import implementer


ANNOTATION_KEY = "kitconcept.intranet.watchers"


class IWatchable(Interface):
    """Marker for content that users can watch."""


class IWatchers(Interface):
    """The users watching a content item."""

    def userids():
        """Return the IDs of the users watching the item, sorted."""

    def is_watching(userid):
        """Return whether the user watches the item."""

    def add(userid):
        """Start watching the item."""

    def remove(userid):
        """Stop watching the item."""

    def clear():
        """Remove all watchers."""


@implementer(IWatchers)
@adapter(IWatchable)
class Watchers:
    def __init__(self, context):
        self.context = context

    def _storage(self, create: bool = False) -> OOTreeSet | None:
        annotations = IAnnotations(self.context)
        storage = annotations.get(ANNOTATION_KEY)
        if storage is None and create:
            storage = annotations[ANNOTATION_KEY] = OOTreeSet()
        return storage

    def userids(self) -> list[str]:
        storage = self._storage()
        return list(storage) if storage else []

    def is_watching(self, userid: str) -> bool:
        storage = self._storage()
        return bool(storage) and userid in storage

    def add(self, userid: str) -> None:
        self._storage(create=True).insert(userid)

    def remove(self, userid: str) -> None:
        storage = self._storage()
        if storage is not None and userid in storage:
            storage.remove(userid)

    def clear(self) -> None:
        annotations = IAnnotations(self.context)
        if ANNOTATION_KEY in annotations:
            del annotations[ANNOTATION_KEY]
