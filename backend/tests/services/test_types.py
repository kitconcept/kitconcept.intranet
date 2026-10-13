from kitconcept.intranet.patches import apply_types_info_patch
from plone import api
from plone.app.dexterity.interfaces import ITypeSettings
from plone.restapi.services.types.get import TypesInfo
from zope.schema.interfaces import IText

import pytest
import transaction


@pytest.mark.parametrize(
    "paths,context_path,expected",
    [
        (None, "news", True),
        ("", "news", True),
        (" \n\t\n", "news", True),
        ("news", "news", True),
        ("news", "news/child", True),
        ("news/", "news/child", True),
        (" /news/ \r\n\r\n /elsewhere ", "news/child", True),
        ("/", "", True),
        ("/", "news/child", True),
        ("/news/child", "news", False),
        ("/news/child", "news/child", True),
        ("news", "newsletter", False),
        ("news", "", False),
        ("elsewhere\n/news", "news", True),
        ("elsewhere\nother", "news", False),
    ],
)
@pytest.mark.parametrize("endpoint", ["types", "expansion"])
def test_path_restrictions(
    portal, manager_request, paths, context_path, expected, endpoint
):
    with api.env.adopt_roles(["Manager"]):
        news = api.content.create(container=portal, type="Document", id="news")
        api.content.create(container=news, type="Document", id="child")
        api.content.create(container=portal, type="Document", id="newsletter")
    fti = portal.portal_types["Document"]
    if paths is not None:
        fti.restrict_to_paths = paths
    transaction.commit()
    url = f"/{context_path}" if context_path else ""
    if endpoint == "types":
        response = manager_request.get(f"{url}/@types")
        data = response.json()
    else:
        response = manager_request.get(f"{url}/?expand=types")
        data = response.json()["@components"]["types"]
    assert response.status_code == 200
    info = next(item for item in data if item["id"] == "Document")
    assert info["addable"] is expected
    assert info["immediately_addable"] is expected


def test_matching_path_does_not_grant_permission(portal, manager_request):
    fti = portal.portal_types["Document"]
    fti.restrict_to_paths = "/"
    fti.global_allow = False
    transaction.commit()
    info = next(
        item
        for item in manager_request.get("/@types").json()
        if item["id"] == "Document"
    )
    assert info["addable"] is False
    assert info["immediately_addable"] is False


def test_unexpanded_types(portal):
    assert TypesInfo(portal, portal.REQUEST)() == {
        "types": {"@id": f"{portal.absolute_url()}/@types"}
    }


def test_patch_is_idempotent():
    original = TypesInfo.__call__
    apply_types_info_patch()
    assert TypesInfo.__call__ is original


def test_paths_setting():
    setting = ITypeSettings["restrict_to_paths"]
    assert IText.providedBy(setting)
    setting.validate("/news\n/events")
    assert setting.required is False
