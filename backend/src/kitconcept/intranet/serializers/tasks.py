from kitconcept.intranet.tasks.model import IInlineTask
from plone.restapi.interfaces import ISerializeToJson
from plone.restapi.serializer.converters import json_compatible
from zope.component import adapter
from zope.interface import implementer
from zope.publisher.interfaces.browser import IBrowserRequest


@implementer(ISerializeToJson)
@adapter(IInlineTask, IBrowserRequest)
class TaskSerializer:
    """Provide read-only task JSON without exposing the catalog's due-date sentinel."""

    def __init__(self, context, request):
        self.context = context

    def __call__(self, **kwargs):
        task = self.context
        return json_compatible({
            "@id": task.absolute_url(),
            "@type": task.portal_type,
            "UID": task.UID(),
            "title": task.Title(),
            "Creator": task.Creator(),
            "created": task.created(),
            "modified": task.modified(),
            "task_due_date": task.task_due_date if task.data["due"] else None,
            "task_completed": task.task_completed,
            "task_status": task.task_status,
            "task_assignees": task.task_assignees,
            "task_source_title": task.task_source_title,
            "task_workspace": task.task_workspace,
            "task_assignee_details": task.task_assignee_details,
        })
