from collections.abc import Generator
from kitconcept.intranet.utils import table_demo
from kitconcept.intranet.utils import table_demo_content as content
from kitconcept.intranet.utils import wiki_content
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


def tables(value: list[dict]) -> list[dict]:
    return [n for n in value if n["type"] == "table"]


class TestWikiContent:
    def test_blocks_skeleton_has_title_block_in_layout(self):
        blocks = wiki_content.blocks([wiki_content.title("T")])
        layout = wiki_content.blocks_layout()
        assert layout["items"] == [wiki_content.TITLE_BLOCK_ID]
        assert blocks[wiki_content.TITLE_BLOCK_ID] == {"@type": "title"}
        assert blocks["__somersault__"]["@type"] == "__somersault__"

    def test_table_has_header_row_and_unique_ids(self):
        node = wiki_content.table(
            "t",
            ["A", "B"],
            [["1", "2"], ["3", ("4", wiki_content.text("!", bold=True))]],
        )
        header, *rows = node["children"]
        assert [c["type"] for c in header["children"]] == ["th", "th"]
        assert [[c["type"] for c in r["children"]] for r in rows] == [["td", "td"]] * 2
        assert rows[1]["children"][1]["children"][0]["children"][1] == {
            "text": "!",
            "bold": True,
        }
        ids = []

        def collect(n):
            if "id" in n:
                ids.append(n["id"])
            for child in n.get("children", []):
                if isinstance(child, dict):
                    collect(child)

        collect(node)
        assert len(ids) == len(set(ids))


class TestTableDemoContent:
    def test_two_pages_with_tables(self):
        pages = content.pages()
        assert [p[0] for p in pages] == [p[0] for p in content.PAGES]
        for _page_id, page_title, blocks, layout in pages:
            value = blocks["__somersault__"]["value"]
            assert value[0] == wiki_content.title(page_title)
            assert len(tables(value)) == 2
            assert layout == wiki_content.blocks_layout()

    def test_wide_table_has_nine_columns(self):
        value = content.participants_page()
        wide = tables(value)[1]
        assert len(wide["children"][0]["children"]) == 9


class TestCreateTableDemoPages:
    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal

    def test_without_workspace_does_nothing(self):
        assert table_demo.create_table_demo_pages(self.portal) == 0

    def test_creates_pages(self, workspace):
        assert table_demo.create_table_demo_pages(self.portal) == 2
        for page_id, page_title in content.PAGES:
            page = workspace[page_id]
            assert page.portal_type == "WikiPage"
            assert page.title == page_title
            assert page.blocks_layout["items"] == [wiki_content.TITLE_BLOCK_ID]
            assert len(tables(page.blocks["__somersault__"]["value"])) == 2

    def test_is_idempotent(self, workspace):
        assert table_demo.create_table_demo_pages(self.portal) == 0
