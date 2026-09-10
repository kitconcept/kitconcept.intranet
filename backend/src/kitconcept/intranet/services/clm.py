from collective.person.behaviors.user import IPloneUser
from kitconcept.intranet.behaviors.clm import ICLM
from plone import api
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

    @staticmethod
    def _author_data(uid):
        author = {"value": uid}
        person = api.content.get(UID=uid)

        if not person:
            return author

        person_url = person.absolute_url()
        username = IPloneUser(person).username
        author.update({
            "person_url": person_url,
            "title": person.title,
        })
        if username:
            author["username"] = username

        return author

    def _authors(self):
        clm = ICLM(self.context, None)
        return (
            [self._author_data(uid) for uid in clm.authors]
            if clm is not None and clm.authors
            else []
        )

    def __call__(self, expand=False):
        if not expand:
            return {"clm": {"@id": f"{self.context.absolute_url()}/@clm"}}

        result = {"clm": {}}
        authors = self._authors()
        if authors:
            result["clm"]["authors"] = authors

        for obj in self.context.aq_chain:
            clm = ICLM(obj, None)

            if clm is None:
                continue

            if clm.responsible_person:
                person = api.content.get(UID=clm.responsible_person)
                responsible_person = {
                    "value": clm.responsible_person,
                    "url": f"{obj.absolute_url()}",
                }

                if person:
                    responsible_person["person_url"] = person.absolute_url()
                    responsible_person["username"] = IPloneUser(person).username
                    responsible_person["title"] = person.title

                result["clm"]["responsible_person"] = responsible_person
                return result

        result["clm"]["responsible_person"] = {}
        return result


class CLMGet(Service):
    def reply(self):
        clm = CLMExpander(self.context, self.request)
        return clm(expand=True)["clm"]
