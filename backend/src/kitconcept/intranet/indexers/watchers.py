from kitconcept.intranet.behaviors.watchers import IWatchable
from kitconcept.intranet.behaviors.watchers import IWatchers
from plone.app.iterate.interfaces import IWorkingCopy
from plone.indexer import indexer


@indexer(IWatchable)
def watchers(obj):
    """User IDs of the watchers, for the "Watched by me" listing criterion.

    A working copy shares the watchers of its baseline, but it is not the
    item the users watch, so it is not indexed.
    """
    if IWorkingCopy.providedBy(obj):
        raise AttributeError("watchers")
    userids = IWatchers(obj).userids()
    if not userids:
        raise AttributeError("watchers")
    return userids
