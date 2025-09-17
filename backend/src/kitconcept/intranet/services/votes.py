from plone import api
from plone.protect.interfaces import IDisableCSRFProtection
from plone.restapi.services import Service
from zExceptions import Unauthorized
from zope.interface import alsoProvides


class VotesPost(Service):
    """Save userID inside votes field.
    This is used to show object likes.
    If user clicks again, it removes the like/vote."""

    def reply(self):
        # Anonymous user can't add a like (can't vote)
        if api.user.is_anonymous():
            raise Unauthorized("Must be logged in to vote.")

        # Disable CSRF protection
        alsoProvides(self.request, IDisableCSRFProtection)

        username = api.user.get_current().id
        votes = self.context.votes or []

        if username in votes:
            votes.remove(username)
            msg = "Like removed"
        else:
            votes.append(username)
            msg = "Like added"

        self.context.votes = votes
        self.context.reindexObject(idxs=["votes"])

        self.request.response.setStatus(200)
        return msg
