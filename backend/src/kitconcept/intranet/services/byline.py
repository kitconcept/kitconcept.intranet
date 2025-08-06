from plone import api
from plone.restapi.interfaces import IExpandableElement
from plone.restapi.services import Service
from zope.component import adapter
from zope.interface import Interface
from zope.interface import implementer


@implementer(IExpandableElement)
@adapter(Interface, Interface)
class BylineExpander:
    def __init__(self, context, request):
        self.context = context
        self.request = request

    def __call__(self, expand=True):
        result = {"byline": {"@id": f"{self.context.absolute_url()}/@byline"}}
        if not expand:
            return result

        users = {}
        for user_id in self.context.creators:
            user = api.user.get(username=user_id)
            if user is not None:
                users[user_id] = {
                    "fullname": user.getProperty("fullname") or user_id,
                    "homepage": user.getProperty("home_page"),
                }

        result["byline"]["users"] = users
        return result


class BylineGet(Service):
    def reply(self):
        expander = BylineExpander(self.context, self.request)
        return expander(expand=True)["byline"]
