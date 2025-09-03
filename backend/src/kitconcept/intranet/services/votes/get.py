from plone.restapi.interfaces import IExpandableElement
from plone.restapi.services import Service
from zope.component import adapter
from zope.interface import implementer
from zope.interface import Interface


@implementer(IExpandableElement)
@adapter(Interface, Interface)
class Votes(object):
    """Get likes of an object.
    Returns 0 if they are no likes.
    """

    def __init__(self, context, request):
        self.context = context
        self.request = request

    def __call__(self, expand=False):
        result = {"votes": {"@id": "{}/@votes".format(self.context.absolute_url())}}
        if not expand:
            return result

        if self.context.votes is None:
            votes = 0
        else:
            votes = len(self.context.votes)

        return {"votes": votes}


class VotesGet(Service):
    def reply(self):
        votes = Votes(self.context, self.request)
        return votes(expand=True)["votes"]
