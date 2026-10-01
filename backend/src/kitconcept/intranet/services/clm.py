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
    def _person_data(uid):
        person_data = {"value": uid}
        person = api.content.get(UID=uid)

        if not person:
            return person_data

        person_url = person.absolute_url()
        username = IPloneUser(person).username
        person_data.update({
            "person_url": person_url,
            "title": person.title,
        })
        if username:
            person_data["username"] = username

        return person_data

    def _authors(self):
        clm = ICLM(self.context, None)
        return (
            [self._person_data(uid) for uid in clm.authors]
            if clm is not None and clm.authors
            else []
        )

    def _feedback_person(self):
        clm = ICLM(self.context, None)
        return (
            self._person_data(clm.feedback_person)
            if clm is not None and clm.feedback_person
            else None
        )

    def __call__(self, expand=False):
        if not expand:
            return {"clm": {"@id": f"{self.context.absolute_url()}/@clm"}}

        result = {"clm": {}}
        authors = self._authors()
        if authors:
            result["clm"]["authors"] = authors

        feedback_person = self._feedback_person()
        if feedback_person:
            result["clm"]["feedback_person"] = feedback_person

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
