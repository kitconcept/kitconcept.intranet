from datetime import date
from dateutil.relativedelta import relativedelta
from kitconcept.intranet.behaviors.content_review import IContentReview
from plone.restapi.deserializer import json_body
from plone.restapi.services import Service
from zExceptions import BadRequest
from zope.component import getUtility
from zope.interface import implementer
from zope.publisher.interfaces import IPublishTraverse
from zope.schema.interfaces import IVocabularyFactory


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

    def _calc_due_date(self, interval: str) -> date:
        mapping = {
            "d": "days",
            "w": "weeks",
            "m": "months",
            "y": "years",
        }
        unit = mapping.get(interval[-1])
        amount = int(interval[:-1])
        return date.today() + relativedelta(**{unit: amount})

    def reply(self):
        if not self.params:
            raise BadRequest(
                "Missing action: expected /@review/approve, "
                "/@review/delegate, or /@review/postpone"
            )

        if len(self.params) > 1:
            raise BadRequest(
                "Too many path segments: expected /@review/approve, "
                "/@review/delegate, or /@review/postpone"
            )

        param = self.params[0]
        match param:
            case "approve":
                # update review_status
                self.context.review_status = "Up-to-date"
                # update review_due_date
                interval = self.context.review_interval
                if not interval:
                    # TODO: send an email that the default still has to be set?
                    pass
                self.context.review_due_date = self._calc_due_date(interval)
                # update review_completed_date
                self.context.review_completed_date = date.today()
            case "delegate":
                field = IContentReview["review_assignee"]
                vocabularyName = field.vocabularyName
                factory = getUtility(IVocabularyFactory, name=vocabularyName)
                vocabulary = factory(self.context)
                data = json_body(self.request)
                if comment := data.get("comment"):
                    self.context.review_comment = comment
                assignee = data.get("assignee", None)
                if assignee not in vocabulary:
                    raise BadRequest(f"Assignee not found in vocabulary: {vocabulary}")
            case "postpone":
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
