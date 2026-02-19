from kitconcept.intranet.behaviors.content_review import IContentReview
from plone.restapi.deserializer import json_body
from plone.restapi.services import Service
from zExceptions import BadRequest
from zope.interface import implementer
from zope.publisher.interfaces import IPublishTraverse


@implementer(IPublishTraverse)
class ReviewPost(Service):
    """@review endpoint."""

    def __init__(self, context, request):
        super().__init__(context, request)
        self.params = []

    def publishTraverse(self, request, name):
        # Treat any path segments after /@review as parameters
        self.params.append(name)
        return self

    def reply(self):
        if not self.params:
            raise BadRequest("Missing parameter")

        if len(self.params) > 1:
            raise BadRequest("Too many parameters")

        param = self.params[0]
        match param:
            case "approve":
                # update review_status
                status = IContentReview["review_status"]
                status.readonly = False
                status.set("Up-to-date")
                status.readonly = True
                # TODO: update review_completed_date & review_due_date
            case "delegate":
                data = json_body(self.request)
            case "postpone":
                # TODO: handle postpone
                data = json_body(self.request)
