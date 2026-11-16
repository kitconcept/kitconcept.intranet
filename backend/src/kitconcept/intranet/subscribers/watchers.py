from kitconcept.intranet.behaviors.watchers import IWatchers
from kitconcept.intranet.utils.watch_notifier import queue_change
from zope.container.interfaces import IContainerModifiedEvent
from zope.lifecycleevent.interfaces import IObjectModifiedEvent


def content_modified(obj, event: IObjectModifiedEvent):
    """A watched item was edited.

    Adding, removing or reordering children fires a container modified event
    on the parent; that is not a change of the watched item itself.
    """
    if IContainerModifiedEvent.providedBy(event):
        return
    queue_change(obj)


def content_transitioned(obj, event):
    """A watched item was published."""
    if event.transition is None or event.new_state is None:
        return
    if event.new_state.getId() != "published":
        return
    queue_change(obj)


def content_checked_in(obj, event):
    """A working copy of a watched item was checked in."""
    queue_change(obj, change_note=getattr(event, "message", None))


def content_copied(obj, event):
    """A copy starts without watchers: nobody chose to watch it."""
    IWatchers(obj).clear()
