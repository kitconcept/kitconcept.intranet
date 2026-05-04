from datetime import date
from kitconcept.intranet.behaviors.content_review import IContentReview
from kitconcept.intranet.utils.calc_due_date import calc_due_date
from plone import api
from plone.protect.interfaces import IDisableCSRFProtection
from plone.restapi.deserializer import json_body
from plone.restapi.services import Service
from zExceptions import BadRequest
from zope.interface import alsoProvides
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
        # Disable CSRF protection
        alsoProvides(self.request, IDisableCSRFProtection)

        match self.params:
            case ["approve"]:
                # update review_status
                self.context.review_status = "Up-to-date"
                # update review_due_date
                default_interval = api.portal.get_registry_record(
                    "kitconcept.intranet.content_review_default_interval"
                )
                interval = self.context.review_interval or default_interval
                self.context.review_due_date = calc_due_date(interval=interval)
                # update review_completed_date
                self.context.review_completed_date = date.today()
            case ["delegate"]:
                field = IContentReview["review_assignee"].bind(self.context)
                vocabulary = field.vocabulary
                data = json_body(self.request)
                if comment := data.get("comment"):
                    self.context.review_comment = comment
                assignee = data.get("assignee", None)
                if assignee not in vocabulary:
                    raise BadRequest(f"Assignee not found in vocabulary: {vocabulary}")
                self.context.review_assignee = assignee
            case ["postpone"]:
                self.context.review_status = "Up-to-date"
                data = json_body(self.request)
                if comment := data.get("comment"):
                    self.context.review_comment = comment
                due_date = data.get("due_date", None)
                if due_date:
                    self.context.review_due_date = date.fromisoformat(due_date)
            case _:
                raise BadRequest(
                    "Unknown action: expected /@review/approve, "
                    "/@review/delegate, or /@review/postpone"
                )
