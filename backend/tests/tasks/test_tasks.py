from Acquisition import aq_base
from copy import deepcopy
from DateTime import DateTime
from kitconcept.intranet.deserializers.tasks import TaskBlocksDeserializer
from kitconcept.intranet.deserializers.tasks import TasksDeserializer
from kitconcept.intranet.tasks.catalog import synchronize
from kitconcept.intranet.tasks.model import MISSING_DUE_DATE
from kitconcept.intranet.tasks.model import TASK_TYPE
from kitconcept.intranet.tasks.values import extract_task_details
from kitconcept.intranet.tasks.values import iter_todos
from kitconcept.intranet.tasks.values import stamp_task_metadata
from kitconcept.intranet.upgrades.v20261012001 import install_inline_tasks
from plone import api
from plone.restapi.behaviors import IBlocks
from plone.restapi.interfaces import ISerializeToJson
from plone.restapi.services.querystringsearch.get import QuerystringSearch
from plone.uuid.interfaces import IUUID
from uuid import UUID
from zExceptions import Unauthorized
from zope.annotation.interfaces import IAnnotations
from zope.component import getMultiAdapter
from zope.event import notify
from zope.lifecycleevent import ObjectModifiedEvent

import json
import pytest


def todo(text="Write report", **kwargs):
    return {
        "type": "p",
        "listStyleType": "todo",
        "checked": False,
        "children": [{"text": text}],
        **kwargs,
    }


def test_modified_without_browser_request():
    from Acquisition import Acquired
    from kitconcept.intranet.tasks.subscribers import modified
    from types import SimpleNamespace

    modified(SimpleNamespace(REQUEST=Acquired), None)


def test_task_text_excludes_mentions_and_their_children(make_plate_mention):
    mention = make_plate_mention("m", "alice")
    mention["children"] = [{"text": "Alice"}]
    details = extract_task_details(
        todo(
            children=[mention, {"text": "Write report"}, make_plate_mention("n", "bob")]
        )
    )
    assert details["text"] == "Write report"
    assert details["assignees"] == ("alice", "bob")


@pytest.fixture
def page(portal):
    with api.env.adopt_roles(["Manager"]):
        workspace = api.content.create(container=portal, type="Workspace", title="Work")
        yield api.content.create(container=workspace, type="WikiPage", title="Tasks")


def save(page, nodes):
    """Simulate a REST blocks update, returning detached client-side task values."""
    page.blocks = TaskBlocksDeserializer(IBlocks["blocks"], page, page.REQUEST)({
        "__somersault__": {"@type": "__somersault__", "value": deepcopy(nodes)}
    })
    notify(ObjectModifiedEvent(page))
    page.reindexObject()
    return deepcopy(list(iter_todos(page.blocks["__somersault__"]["value"])))


def tasks(portal):
    return portal.portal_catalog.unrestrictedSearchResults(portal_type=TASK_TYPE)


def test_index_identity_text_and_traversal(page, portal, make_plate_mention):
    nodes = save(
        page,
        [
            todo(
                children=[
                    {"text": "Ask "},
                    make_plate_mention("m", "alice"),
                    {"text": " before "},
                    {"type": "date", "value": "2026-10-15", "children": [{"text": ""}]},
                ]
            )
        ],
    )
    brain = tasks(portal)[0]
    assert str(UUID(nodes[0]["taskId"])) == nodes[0]["taskId"]
    assert f"{IUUID(page)}:{nodes[0]['taskId']}" == brain.UID
    assert brain.Title == "Ask  before 2026-10-15"
    assert brain.getObject().task_assignees == ("alice",)
    assert brain.task_due_date == DateTime("2026-10-15 UTC")
    assert brain.task_due_date is not None
    assert brain.task_completed is None
    assert brain.getObject().UID() == brain.UID
    assert portal.portal_catalog(SearchableText="Ask", portal_type=TASK_TYPE)


def test_incremental_writes(page, portal, monkeypatch):
    nodes = save(page, [todo("One"), todo("Two")])
    brain = tasks(portal)[0]
    task = brain.getObject()
    assert brain.getPath() == "/".join(task.getPhysicalPath())
    assert len(tasks(portal)) == 2
    assert task.task_source_title == page.Title()
    calls = []
    catalog = portal.portal_catalog
    original = type(aq_base(catalog)).catalog_object

    def record(self, obj, *args, **kwargs):
        if obj.portal_type == TASK_TYPE:
            calls.append(obj.UID())
        return original(self, obj, *args, **kwargs)

    monkeypatch.setattr(type(aq_base(catalog)), "catalog_object", record)
    save(page, list(reversed(nodes)))
    assert calls == []
    nodes[0]["children"] = [{"text": "Changed"}]
    save(page, nodes)
    assert calls == [f"{IUUID(page)}:{nodes[0]['taskId']}"]
    save(page, nodes[:1])
    assert len(tasks(portal)) == 1
    save(page, [])
    assert not tasks(portal)


def test_completion_and_author_are_trusted(page, portal, http_request):
    nodes = save(page, [todo()])
    author = nodes[0]["taskCreator"]
    nodes[0].update(taskCreator="forged", taskCreated="1900-01-01", checked=True)
    incoming = TasksDeserializer(page, http_request)({"value": nodes})
    nodes = save(page, incoming["value"])
    assert nodes[0]["taskCreator"] == author
    assert tasks(portal)[0].task_completed is not None
    completed = nodes[0]["taskCompleted"]
    nodes = save(page, nodes)
    assert nodes[0]["taskCompleted"] == completed
    nodes[0]["checked"] = False
    nodes = save(page, nodes)
    assert "taskCompleted" not in nodes[0]
    assert tasks(portal)[0].task_completed is None


def test_duplicate_ids_and_comment_exclusion(page, portal):
    nodes = save(page, [todo()])
    nodes = save(page, nodes + deepcopy(nodes))
    assert len({node["taskId"] for node in nodes}) == 2
    blocks = deepcopy(page.blocks)
    blocks["__somersault__"]["discussions"] = {"d": {"contentRich": [todo("Comment")]}}
    page.blocks = blocks
    page.reindexObject()
    assert len(tasks(portal)) == 2


def test_refresh_preserves_task_metadata(page, portal):
    nodes = save(page, [todo(checked=True)])
    with api.env.adopt_roles(["Manager"]):
        portal.portal_catalog.refreshCatalog()
    brain = tasks(portal)[0]
    assert f"{IUUID(page)}:{nodes[0]['taskId']}" == brain.UID
    assert brain.Creator == nodes[0]["taskCreator"]
    assert brain.task_completed is not None


def test_move_copy_delete(page, portal):
    nodes = save(page, [todo()])
    with api.env.adopt_roles(["Manager"]):
        copied = api.content.copy(source=page, target=page.__parent__, id="copy")
        assert (
            copied.blocks["__somersault__"]["value"][0]["taskId"] != nodes[0]["taskId"]
        )
        api.content.rename(obj=page, new_id="renamed")
        assert all(brain.getObject() for brain in tasks(portal))
        api.content.delete(obj=page)
        assert len(tasks(portal)) == 1
        api.content.delete(obj=copied)
        assert not tasks(portal)


def test_querystring_search_current_user_and_missing_due(page, portal, http_request):
    save(
        page,
        [
            todo("Undated"),
            todo("Done", checked=True),
            todo(
                "Dated",
                children=[
                    {"text": "Dated "},
                    {"type": "date", "value": "2026-10-20", "children": [{"text": ""}]},
                ],
            ),
        ],
    )
    # Source titles are resolved live without recataloging the unchanged task.
    page.title = "Renamed task source"
    assert "task_source_title" not in portal.portal_catalog.schema()
    assert "due_date" not in portal.portal_catalog.indexes()
    http_request["BODY"] = json.dumps({
        "query": [
            {
                "i": "portal_type",
                "o": "plone.app.querystring.operation.selection.any",
                "v": [TASK_TYPE],
            },
            {
                "i": "task_assignees",
                "o": "plone.app.querystring.operation.string.currentUser",
            },
            {
                "i": "task_status",
                "o": "plone.app.querystring.operation.selection.any",
                "v": ["open"],
            },
        ],
        "sort_on": "task_due_date",
        "b_size": 1,
        "metadata_fields": [
            "UID",
            "task_source_title",
            "task_due_date",
            "task_workspace",
            "task_assignee_details",
        ],
    })
    result = QuerystringSearch(portal, http_request)()
    assert result["items_total"] == 2
    assert len(result["items"]) == 1
    assert result["items"][0]["task_due_date"].startswith("2026-10-20")
    assert result["items"][0]["task_source_title"] == "Renamed task source"
    assert result["items"][0]["task_workspace"] == {
        "@id": page.__parent__.absolute_url(),
        "title": page.__parent__.Title(),
    }
    assert result["items"][0]["task_assignee_details"][0]["id"]


def test_workspace_filter_and_live_assignees(page, portal, http_request, make_user):
    make_user("alice", "Alice Example")
    make_user("bob", "Bob Example")
    save(
        page,
        [
            todo(
                children=[
                    {
                        "type": "mention",
                        "key": "alice",
                        "value": "Alice",
                        "children": [{"text": ""}],
                    },
                    {
                        "type": "mention",
                        "key": "bob",
                        "value": "Bob",
                        "children": [{"text": ""}],
                    },
                ]
            )
        ],
    )
    with api.env.adopt_roles(["Manager"]):
        other_workspace = api.content.create(
            container=portal, type="Workspace", title="Other"
        )
        other_page = api.content.create(
            container=other_workspace, type="WikiPage", title="Other tasks"
        )
        save(other_page, [todo("Another task")])
    page.__parent__.title = "Renamed workspace"
    http_request["BODY"] = json.dumps({
        "query": [
            {
                "i": "portal_type",
                "o": "plone.app.querystring.operation.selection.any",
                "v": [TASK_TYPE],
            },
            {
                "i": "path",
                "o": "plone.app.querystring.operation.string.absolutePath",
                "v": "/work",
            },
        ],
        "metadata_fields": ["task_workspace", "task_assignee_details"],
    })
    result = QuerystringSearch(portal, http_request)()
    assert result["items_total"] == 1
    assert result["items"][0]["task_workspace"]["title"] == "Renamed workspace"
    assert result["items"][0]["task_assignee_details"] == [
        {"id": "alice", "title": "Alice Example"},
        {"id": "bob", "title": "Bob Example"},
    ]


def test_migration_creator_fallback(page, portal):
    page.blocks = {"__somersault__": {"value": [todo()]}}
    synchronize(page, portal.portal_catalog, legacy=True)
    assert tasks(portal)[0].Creator == page.Creator()


def test_noop_preserves_document_metadata(page):
    nodes = save(page, [todo(checked=True)])
    assert save(page, nodes) == nodes


def test_task_security_follows_page_and_ancestor(page, portal, make_user):
    save(page, [todo()])
    brain = tasks(portal)[0]
    make_user("reader", "Reader")
    with api.env.adopt_user(username="reader"):
        assert not portal.portal_catalog(portal_type=TASK_TYPE)
        with pytest.raises(Unauthorized):
            brain.getObject()
    workspace = page.__parent__
    workspace.manage_setLocalRoles("reader", ["Reader"])
    workspace.reindexObjectSecurity()
    # Local-role decisions are cached for the duration of a browser request.
    IAnnotations(page.REQUEST).clear()
    with api.env.adopt_user(username="reader"):
        assert api.user.has_permission("View", obj=page)
        assert len(portal.portal_catalog(portal_type=TASK_TYPE)) == 1
        assert tasks(portal)[0].getObject().UID()
    workspace.manage_delLocalRoles(["reader"])
    workspace.reindexObjectSecurity()
    IAnnotations(page.REQUEST).clear()
    with api.env.adopt_user(username="reader"):
        assert not portal.portal_catalog(portal_type=TASK_TYPE)
        with pytest.raises(Unauthorized):
            tasks(portal)[0].getObject()


def test_ancestor_move_copy_delete(page, portal):
    nodes = save(page, [todo()])
    workspace = page.__parent__
    with api.env.adopt_roles(["Manager"]):
        copied = api.content.copy(source=workspace, target=portal, id="work-copy")
        assert (
            copied[page.id].blocks["__somersault__"]["value"][0]["taskId"]
            != nodes[0]["taskId"]
        )
        assert len(tasks(portal)) == 2
        api.content.rename(obj=workspace, new_id="renamed-work")
        assert len(tasks(portal)) == 2
        assert all(brain.getObject() for brain in tasks(portal))
        api.content.delete(obj=workspace)
        assert len(tasks(portal)) == 1


def test_pasted_uuid_is_namespaced_without_catalog_queries(page, portal, monkeypatch):
    nodes = save(page, [todo()])
    other = api.content.create(
        container=page.__parent__, type="WikiPage", title="Other"
    )

    def unexpected_query(*args, **kwargs):
        pytest.fail("Stamping task metadata must not query or flush the catalog")

    with monkeypatch.context() as patch:
        patch.setattr(
            portal.portal_catalog, "unrestrictedSearchResults", unexpected_query
        )
        stamped = stamp_task_metadata(other, {"value": deepcopy(nodes)})
    pasted = save(other, stamped["value"])
    assert pasted[0]["taskId"] == nodes[0]["taskId"]
    brains = tasks(portal)
    assert {brain.UID for brain in brains} == {
        f"{IUUID(page)}:{nodes[0]['taskId']}",
        f"{IUUID(other)}:{nodes[0]['taskId']}",
    }
    assert all(brain.getObject().UID() == brain.UID for brain in brains)
    save(other, [])
    assert [brain.UID for brain in tasks(portal)] == [
        f"{IUUID(page)}:{nodes[0]['taskId']}"
    ]


def test_dates_mentions_and_conversion_are_removed_from_indexes(
    page, portal, make_plate_mention
):
    nodes = save(
        page,
        [
            todo(
                children=[
                    make_plate_mention("mention", "alice"),
                    {"type": "date", "value": "2026-10-15", "children": [{"text": ""}]},
                ]
            )
        ],
    )
    nodes[0]["children"] = [{"text": "No date or mention"}]
    nodes = save(page, nodes)
    brain = tasks(portal)[0]
    assert brain.task_due_date == MISSING_DUE_DATE
    assert brain.getObject().task_assignees == (brain.Creator,)
    assert not portal.portal_catalog(task_assignees="alice", portal_type=TASK_TYPE)
    nodes[0].pop("listStyleType")
    save(page, nodes)
    assert not tasks(portal)


def test_upgrade_backfills_existing_tasks_idempotently(page, portal):
    page.blocks = {"__somersault__": {"value": [todo(checked=True)]}}
    install_inline_tasks(portal.portal_setup)
    original = deepcopy(page.blocks)
    assert tasks(portal)[0].Creator == page.Creator()
    install_inline_tasks(portal.portal_setup)
    assert page.blocks == original
    assert len(tasks(portal)) == 1


def test_expiration_is_inherited(page, portal, make_user):
    make_user("reader", "Reader")
    save(page, [todo()])
    page.setExpirationDate(DateTime("2000-01-01 UTC"))
    portal.portal_catalog.refreshCatalog()
    with api.env.adopt_user(username="reader"):
        assert not portal.portal_catalog(portal_type=TASK_TYPE)


def test_invalid_date_does_not_prevent_indexing(page, portal):
    save(
        page,
        [
            todo(
                children=[
                    {"type": "date", "value": "invalid", "children": [{"text": ""}]}
                ]
            )
        ],
    )
    assert tasks(portal)[0].task_due_date == MISSING_DUE_DATE


def test_task_full_object_serialization(page, portal, http_request):
    save(page, [todo()])
    task = tasks(portal)[0].getObject()
    result = getMultiAdapter((task, http_request), ISerializeToJson)()
    assert result["@type"] == TASK_TYPE
    assert result["UID"] == IUUID(task)
    assert result["task_source_title"] == page.Title()
    assert result["task_due_date"] is None


def test_removing_entire_block_unindexes_tasks(page, portal):
    save(page, [todo()])
    page.blocks = TaskBlocksDeserializer(IBlocks["blocks"], page, page.REQUEST)({})
    notify(ObjectModifiedEvent(page))
    assert not tasks(portal)


def test_link_integrity_checks_page_once_and_skips_virtual_fragments(
    page, http_request, monkeypatch
):
    from plone.app.linkintegrity.browser.info import DeleteConfirmationInfo

    save(page, [todo(), todo("Second")])
    checked = []
    monkeypatch.setattr(
        DeleteConfirmationInfo,
        "check_object",
        lambda self, obj, *args: checked.append(obj),
    )
    view = getMultiAdapter((page, http_request), name="delete_confirmation_info")
    assert view.get_breaches([page]) == []
    assert checked == [page]
