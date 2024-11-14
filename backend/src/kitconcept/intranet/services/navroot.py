from kitconcept.intranet.interfaces import IBrowserLayer
from plone.restapi.services import Service
from plone.restapi.services.navroot.get import Navroot
from zope.component import adapter
from zope.interface import Interface


# Grab them from the behavior?
SETTINGS = [
    "logo",
    "accent_color",
    "accent_foreground_color",
    "primary_color",
    "primary_foreground_color",
    "secondary_color",
    "secondary_foreground_color",
    "footer_logos",
    "footer_links",
]


@adapter(Interface, IBrowserLayer)
class CustomNavroot(Navroot):
    def filterAttributes(self, data):
        return {key: data.get(key) for key in data if key in SETTINGS}

    def __call__(self, expand=False):
        result = super().__call__(expand)
        if not expand:
            return result
        return {
            "navroot": {"navroot": self.filterAttributes(result["navroot"]["navroot"])}
        }


class NavrootGet(Service):
    def reply(self):
        navroot = Navroot(self.context, self.request)
        return navroot(expand=True)["navroot"]
