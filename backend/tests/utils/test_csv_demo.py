from collections.abc import Generator
from kitconcept.intranet.utils import csv_demo
from kitconcept.intranet.utils import csv_demo_content as content
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


class TestCsvDemoContent:
    def test_file_is_a_semicolon_table_with_more_than_five_rows(self):
        lines = content.FILE_TEXT.strip().splitlines()
        assert lines[0] == "Arbeitspaket;Budget;Verantwortlich;Status"
        assert len(lines) > 6
        assert all(line.count(";") == 3 for line in lines)

    def test_page_holds_a_csv_table_block_pointing_at_the_file(self):
        page_id, _title, blocks, _layout = content.page_fields()
        value = blocks["__somersault__"]["value"]
        block = next(n for n in value if n["type"] == "ploneBlock")
        assert block["@type"] == "csvtable"
        assert block["url"] == f"{content.CONTAINER_PATH}/{content.FILE_ID}"
        assert value[0]["type"] == "title"
        assert page_id == content.PAGE_ID


class TestCreateCsvDemo:
    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal

    def test_without_workspace_does_nothing(self):
        assert csv_demo.create_csv_demo(self.portal) == 0

    def test_creates_file_and_page(self, workspace):
        assert csv_demo.create_csv_demo(self.portal) == 2
        file_ = workspace[content.FILE_ID]
        assert file_.portal_type == "File"
        assert file_.file.contentType == "text/csv"
        assert file_.file.data.decode("utf-8") == content.FILE_TEXT
        page = workspace[content.PAGE_ID]
        assert page.portal_type == "WikiPage"
        assert page.title == content.PAGE_TITLE

    def test_is_idempotent(self, workspace):
        assert csv_demo.create_csv_demo(self.portal) == 0
