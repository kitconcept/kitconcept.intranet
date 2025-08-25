from kitconcept.intranet.behaviors.lcm import ILCM
from plone.restapi.interfaces import IExpandableElement
from plone.restapi.services import Service
from zope.component import adapter
from zope.interface import Interface
from zope.interface import implementer


@implementer(IExpandableElement)
@adapter(Interface, Interface)
class LCMExpander:
    """Expandable element to add inherited LCM information"""

    def __init__(self, context, request):
        self.context = context
        self.request = request

    def __call__(self, expand=False):
        if not expand:
            return {"lcm": {"@id": f"{self.context.absolute_url()}/@lcm"}}

        for obj in self.context.aq_chain:
            lcm = ILCM(obj, None)

            if lcm is None:
                continue

            if lcm.responsible_person:
                return {
                    "lcm": {
                        "responsible_person": {
                            "value": lcm.responsible_person,
                            "url": f"{obj.absolute_url()}",
                        },
                    }
                }

        return {"lcm": {"responsible_person": {}}}


class LCMGet(Service):
    def reply(self):
        lcm = LCMExpander(self.context, self.request)
        return lcm(expand=True)["lcm"]
