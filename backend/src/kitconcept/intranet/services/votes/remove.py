# -*- coding: utf-8 -*-
from plone.restapi.interfaces import IPloneRestapiLayer
from plone.restapi.services import Service
from zope.interface import alsoProvides
from zope.interface import implementer
from zope.interface import noLongerProvides
from zope.publisher.interfaces import IPublishTraverse
import plone.protect.interfaces
from plone import api


@implementer(IPublishTraverse)
class VotesDelete(Service):
    """Save userID inside votes field.
    This is used to show object likes.
    If user click again then removes the like/vote."""

    def __init__(self, context, request):
        super(VotesDelete, self).__init__(context, request)
        self.params = []

    def publishTraverse(self, request, name):
        # Treat any path segments after /@types as parameters
        self.params.append(name)
        return self

    def reply(self):
        username = api.user.get_current().id
        # Anonymous user can't add a like (can't vote)
        if username == "acl_users":
            return "No logged-in user."

        # Disable CSRF protection
        if "IDisableCSRFProtection" in dir(plone.protect.interfaces):
            alsoProvides(self.request, plone.protect.interfaces.IDisableCSRFProtection)

        # Make sure we get the right dexterity-types adapter
        if IPloneRestapiLayer.providedBy(self.request):
            noLongerProvides(self.request, IPloneRestapiLayer)

        votes = self.context.votes or []
        msg = ""

        if username in votes:
            votes.remove(username)
            msg = "Like removed"

        self.context.votes = votes
        self.context.reindexObject(idxs=["votes"])

        self.request.response.setStatus(200)
        return msg
