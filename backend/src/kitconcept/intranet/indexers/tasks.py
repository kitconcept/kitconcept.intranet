from kitconcept.intranet.tasks.model import IInlineTask
from plone.indexer import indexer


@indexer(IInlineTask)
def allowed_roles_and_users(task):
    """Override Plone's generic indexer, which precedes direct attribute lookup."""
    return task.allowedRolesAndUsers


@indexer(IInlineTask)
def review_state(task):
    """Expose the containing page's workflow state rather than a task workflow."""
    from plone import api

    return api.content.get_state(obj=task.page, default=None)
