from kitconcept.intranet.behaviors.clm import ICLM
from plone.restapi.interfaces import IExpandableElement
from plone.restapi.services import Service
from zope.component import adapter
from zope.interface import Interface
from zope.interface import implementer


@implementer(IExpandableElement)
@adapter(Interface, Interface)
class CLMExpander:
    """Expandable element to add inherited CLM information"""

    def __init__(self, context, request):
        self.context = context
        self.request = request

    def __call__(self, expand=False):
        if not expand:
            return {"clm": {"@id": f"{self.context.absolute_url()}/@clm"}}

        for obj in self.context.aq_chain:
            clm = ICLM(obj, None)

            if clm is None:
                continue

            if clm.responsible_person:
                return {
                    "clm": {
                        "responsible_person": {
                            "value": clm.responsible_person,
                            "url": f"{obj.absolute_url()}",
                        },
                    }
                }

        return {"clm": {"responsible_person": {}}}


class CLMGet(Service):
    def reply(self):
        clm = CLMExpander(self.context, self.request)
        return clm(expand=True)["clm"]
