from plone import api
from plone.protect.interfaces import IDisableCSRFProtection
from plone.restapi.services import Service
from zope.interface import alsoProvides


class VotesPost(Service):
    """Save userID inside votes field.
    This is used to show object likes.
    If user clicks again, it removes the like/vote."""

    def reply(self):
        username = api.user.get_current().id

        # Anonymous user can't add a like (can't vote)
        if username == "acl_users":
            return "No logged-in user."

        # Disable CSRF protection
        alsoProvides(self.request, IDisableCSRFProtection)

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
