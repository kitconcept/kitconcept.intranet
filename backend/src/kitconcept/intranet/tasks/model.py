"""Transient catalogable task objects reconstructed from the current page value."""

from .values import extract_task_details
from .values import iter_todos
from AccessControl import ClassSecurityInfo
from AccessControl.class_init import InitializeClass
from Acquisition import Implicit
from Acquisition import aq_base
from Acquisition import aq_parent
from DateTime import DateTime
from OFS.Traversable import Traversable
from plone.indexer.wrapper import IndexableObjectWrapper
from plone.uuid.interfaces import IUUID
from Products.CMFCore.interfaces import ICatalogAware
from Products.CMFCore.interfaces import IContentish
from Products.CMFCore.permissions import View
from Products.CMFCore.utils import getToolByName
from zope.interface import Interface
from zope.interface import implementer
from zope.traversing.interfaces import TraversalError


TASK_TYPE = "Inline Task"
NAMESPACE = "++tasks++items"
# DateIndex uses 32-bit minute keys: year 4000 fits, unlike a year-9999 ceiling.
MISSING_DUE_DATE = DateTime("4000-01-01 UTC")


class IInlineTask(IContentish, ICatalogAware):
    """A transient catalogable view of a todo in a page's document."""


class ITaskContainer(Interface):
    """Virtual traversal container; nothing is persisted here."""


@implementer(ITaskContainer)
class TaskContainer(Implicit, Traversable):
    """Resolve task UUIDs from the document without persisting a virtual container."""

    security = ClassSecurityInfo()
    security.declareObjectProtected(View)
    __ac_local_roles__ = None
    __ac_local_roles_block__ = False

    def getPhysicalPath(self):
        return (*self.__parent__.getPhysicalPath(), NAMESPACE)

    def __getitem__(self, task_id):
        """Reconstruct a task, or fail traversal when its todo no longer exists."""
        page = self.__parent__
        value = (getattr(page, "blocks", {}) or {}).get("__somersault__", {})
        for node in iter_todos(value.get("value", [])):
            if node.get("taskId") == task_id:
                # Use the page's acquisition chain for permissions and local roles.
                return InlineTask(page, node).__of__(page)
        raise KeyError(task_id)


InitializeClass(TaskContainer)


class TaskNamespace:
    """Expose the virtual container at the named ++tasks++items namespace."""

    def __init__(self, context, request=None):
        self.context = context

    def traverse(self, name, ignored):
        if name != "items":
            raise TraversalError(name)
        container = TaskContainer()
        container.__parent__ = self.context
        return container.__of__(self.context)


@implementer(IInlineTask)
class InlineTask(Implicit):
    """Present a todo as content while inheriting visibility from its page.

    Catalog identity, text, and timestamps are explicit so acquisition cannot
    silently substitute those of the containing page. Only the JSON node persists.
    """

    security = ClassSecurityInfo()
    security.declareObjectProtected(View)
    portal_type = TASK_TYPE
    meta_type = TASK_TYPE
    is_folderish = False
    __ac_local_roles__ = None
    __ac_local_roles_block__ = False

    def __init__(self, page, node):
        self.page = page
        self.__parent__ = page
        self.node = node
        self.id = node["taskId"]
        self.data = extract_task_details(node)

    def getId(self):
        return self.id

    def UID(self):
        """Namespace catalog identity by page, without querying for pasted UUIDs."""
        return f"{IUUID(self.page)}:{self.id}"

    def getPhysicalPath(self):
        return (*self.page.getPhysicalPath(), NAMESPACE, self.id)

    def absolute_url(self):
        return f"{self.page.absolute_url()}/{NAMESPACE}/{self.id}"

    def Title(self):
        return self.data["text"]

    def Description(self):
        return self.Title()

    def SearchableText(self):
        return self.Title()

    def Creator(self):
        return self.node["taskCreator"]

    def listCreators(self):
        return (self.Creator(),)

    def Type(self):
        return TASK_TYPE

    def created(self):
        return DateTime(self.node["taskCreated"])

    def modified(self):
        return DateTime(self.node["taskModified"])

    @property
    def task_completed(self):
        value = self.node.get("taskCompleted")
        return DateTime(value) if value else None

    @property
    def task_status(self):
        return "completed" if self.node.get("checked") else "open"

    @property
    def task_due_date(self):
        """Return UTC calendar midnight, or the undated-last catalog sentinel."""
        value = self.data["due"]
        if not value:
            return MISSING_DUE_DATE
        return DateTime(f"{value} 00:00:00 UTC")

    @property
    def task_assignees(self):
        """Use all mentioned users, falling back to the task's original creator."""
        return self.data["assignees"] or (self.Creator(),)

    @property
    def task_source_title(self):
        return self.page.Title()

    @property
    def task_workspace(self):
        """Resolve the nearest workspace live, including renamed or moved pages."""
        parent = aq_parent(self.page)
        while parent is not None:
            if getattr(aq_base(parent), "portal_type", None) == "Workspace":
                return {"@id": parent.absolute_url(), "title": parent.Title()}
            parent = aq_parent(parent)
        return None

    @property
    def task_assignee_details(self):
        """Expose every assignee with a display name, falling back to the user ID."""
        from plone import api
        from plone.restapi.services.users.get import getPortraitUrl

        result = []
        for user_id in self.task_assignees:
            user = api.user.get(username=user_id)
            result.append({
                "id": user_id,
                "title": (user.getProperty("fullname") if user else None) or user_id,
                "portrait": getPortraitUrl(user),
            })
        return result

    def reindexObject(self, idxs=None, update_metadata=1, **kwargs):
        """Support catalog refresh and security reindexing through virtual traversal."""
        catalog = getToolByName(self.page, "portal_catalog")
        catalog.catalog_object(
            self,
            "/".join(self.getPhysicalPath()),
            idxs=idxs,
            update_metadata=update_metadata,
        )

    @property
    def allowedRolesAndUsers(self):
        """Reuse the page's security projection, including local roles."""
        catalog = getToolByName(self.page, "portal_catalog")
        return IndexableObjectWrapper(self.page, catalog).allowedRolesAndUsers

    @property
    def effective(self):
        return self.page.effective()

    @property
    def expires(self):
        return self.page.expires()


InitializeClass(InlineTask)


def task_uuid(task):
    """Expose the composite catalog UID rather than acquiring the page's UUID."""
    return task.UID()
