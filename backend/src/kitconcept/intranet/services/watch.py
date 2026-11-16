from kitconcept.intranet.behaviors.watchers import IWatchable
from kitconcept.intranet.behaviors.watchers import IWatchers
from kitconcept.intranet.utils.watch_notifier import watching_enabled
from plone import api
from plone.protect.interfaces import IDisableCSRFProtection
from plone.restapi.interfaces import IExpandableElement
from plone.restapi.services import Service
from zExceptions import NotFound
from zExceptions import Unauthorized
from zope.component import adapter
from zope.interface import Interface
from zope.interface import alsoProvides
from zope.interface import implementer


def current_userid() -> str | None:
    if api.user.is_anonymous():
        return None
    return api.user.get_current().getId()


@implementer(IExpandableElement)
@adapter(IWatchable, Interface)
class WatchExpander:
    """Whether the current user watches the item.

    Only the current user's own state is returned, never the list of
    watchers.
    """

    def __init__(self, context, request):
        self.context = context
        self.request = request

    def __call__(self, expand=False):
        url = f"{self.context.absolute_url()}/@watch"
        result = {"watch": {"@id": url}}
        if not expand:
            return result
        userid = current_userid()
        result["watch"]["watching"] = bool(
            userid and IWatchers(self.context).is_watching(userid)
        )
        return result


class WatchGet(Service):
    def reply(self):
        if not watching_enabled():
            raise NotFound("Watching content is disabled.")
        return WatchExpander(self.context, self.request)(expand=True)["watch"]


class WatchPost(Service):
    """Toggle watching the item for the current user.

    This changes no content data: it fires no modified event, leaves the
    modification date alone and only reindexes ``watchers``.
    """

    def reply(self):
        if not watching_enabled():
            raise NotFound("Watching content is disabled.")
        userid = current_userid()
        if userid is None:
            raise Unauthorized("Must be logged in to watch content.")

        alsoProvides(self.request, IDisableCSRFProtection)

        watchers = IWatchers(self.context)
        if watchers.is_watching(userid):
            watchers.remove(userid)
        else:
            watchers.add(userid)
        self.context.reindexObject(idxs=["watchers"])

        return {
            "@id": f"{self.context.absolute_url()}/@watch",
            "watching": watchers.is_watching(userid),
        }
