from collections.abc import Generator
from kitconcept.intranet.utils import diff_demo
from kitconcept.intranet.utils import diff_demo_content as content
from plone import api
from Products.CMFPlone.Portal import PloneSite

import pytest


@pytest.fixture(scope="class")
def portal(app_class, create_site, answers) -> Generator[PloneSite]:
    site = create_site(app=app_class, answers=answers)
    yield site


@pytest.fixture(scope="class")
def workspace(portal):
    """The GreenCat workspace, as the example content delivers it."""
    with api.env.adopt_roles(["Manager"]):
        workspaces = api.content.create(
            container=portal, type="Document", id="workspaces", title="Workspaces"
        )
        return api.content.create(
            container=workspaces,
            type="Workspace",
            id=content.CONTAINER_PATH.rsplit("/", 1)[-1],
            title="EU-Projekt GreenCat",
        )


class TestDiffDemoContent:
    def test_four_versions_with_notes(self):
        versions = content.VERSIONS
        assert len(versions) == 4
        assert versions[0][1] is None
        assert all(note for _, note in versions[1:])

    def test_edits_build_on_each_other(self):
        edits = content.edits()
        assert len(edits) == 3
        first, second, third = (value for value, _ in edits)
        ids = [n["id"] for n in first]
        assert "p-beschluss" in ids
        assert "t-clara" in [n["id"] for n in second]
        assert third[ids.index("h-diskussion")]["align"] == "center"


class TestCreateDemoPage:
    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal

    def history(self, page) -> list[str]:
        """Change notes of all versions of ``page``, oldest first."""
        with api.env.adopt_roles(["Manager"]):
            repository = api.portal.get_tool("portal_repository")
            history = repository.getHistoryMetadata(page)
            return [
                history.retrieve(i, countPurged=False)["metadata"]["sys_metadata"][
                    "comment"
                ]
                for i in range(history.getLength(countPurged=False))
            ]

    def test_without_workspace_does_nothing(self):
        assert diff_demo.create_demo_page(self.portal) == 0

    def test_creates_page_with_versions(self, workspace):
        assert diff_demo.create_demo_page(self.portal) == 4
        page = workspace[content.PAGE_ID]
        assert page.portal_type == "WikiPage"
        notes = self.history(page)
        assert len(notes) == 4
        assert notes[1:] == [note for _, note in content.VERSIONS[1:]]

    def test_is_idempotent(self, workspace):
        assert diff_demo.create_demo_page(self.portal) == 0
        assert len(self.history(workspace[content.PAGE_ID])) == 4

    def test_current_content_is_last_version(self, workspace):
        page = workspace[content.PAGE_ID]
        value = page.blocks["__somersault__"]["value"]
        by_id = {n["id"]: n for n in value}
        assert by_id["h-diskussion"]["align"] == "center"
        assert by_id["p-naechstes"]["blockWidth"] == "wide"
