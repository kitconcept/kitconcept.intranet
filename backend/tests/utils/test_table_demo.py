from collections.abc import Generator
from kitconcept.intranet.utils import csv_demo_content as csv_content
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


# Tables per demo page.
TABLES = {
    "projektbudget-2026": 2,
    "teilnehmende-konsortialtreffen": 4,
    "tabellenbreiten": 7,
}


def tables(value: list[dict]) -> list[dict]:
    return [n for n in value if n["type"] == "table"]


def cell_text(cell: dict) -> str:
    return "".join(run["text"] for run in cell["children"][0]["children"])


def links(value) -> list[dict]:
    """Every link node in ``value`` (nodes at any depth)."""
    if isinstance(value, list):
        return [found for item in value for found in links(item)]
    if not isinstance(value, dict):
        return []
    found = [value] if value.get("type") == "a" else []
    return found + links(value.get("children", []))


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

    def test_span_merges_cells(self):
        node = wiki_content.table(
            "t", ["A", "B", "C"], [["1", wiki_content.Span("2", cols=2)]]
        )
        _header, merged = node["children"]
        assert [c.get("colSpan") for c in merged["children"]] == [None, 2]
        assert cell_text(merged["children"][1]) == "2"

    def test_table_width(self):
        node = wiki_content.table("t", ["A"], [["1"]], width="layout")
        assert node["blockWidth"] == "layout"
        assert "blockWidth" not in wiki_content.table("t", ["A"], [["1"]])

    def test_table_width_medium(self):
        node = wiki_content.table("t", ["A"], [["1"]], width="medium")
        assert node["blockWidth"] == "medium"

    def test_unknown_table_width_is_an_error(self):
        with pytest.raises(ValueError):
            wiki_content.table("t", ["A"], [["1"]], width="wide")

    def test_custom_table_width(self):
        """Stored as the resize handle stores it: ``tableWidth``, the
        columns adding up to it, the step the editor stamps."""
        node = wiki_content.table(
            "t", ["A", "B"], [["1", "2"]], col_sizes=[400, 560], table_width=960
        )
        assert node["tableWidth"] == 960
        assert node["colSizes"] == [400, 560]
        assert node["blockWidth"] == "default"
        assert "tableWidth" not in wiki_content.table("t", ["A"], [["1"]])

    def test_custom_table_width_keeps_a_given_step(self):
        node = wiki_content.table(
            "t", ["A"], [["1"]], col_sizes=[960], table_width=960, width="medium"
        )
        assert node["blockWidth"] == "medium"

    @pytest.mark.parametrize("col_sizes", [None, [400, 500]])
    def test_custom_table_width_needs_columns_adding_up(self, col_sizes):
        with pytest.raises(ValueError):
            wiki_content.table(
                "t", ["A", "B"], [["1", "2"]], col_sizes=col_sizes, table_width=960
            )

    def test_centred_table(self):
        node = wiki_content.table("t", ["A"], [["1"]], width="layout", align="center")
        assert node["tableAlign"] == "center"
        assert "tableAlign" not in wiki_content.table("t", ["A"], [["1"]])

    def test_unknown_table_alignment_is_an_error(self):
        with pytest.raises(ValueError):
            wiki_content.table("t", ["A"], [["1"]], align="right")


class TestTableDemoContent:
    def test_pages_with_tables(self):
        pages = content.pages()
        assert [p[0] for p in pages] == [p[0] for p in content.PAGES]
        for page_id, page_title, blocks, layout in pages:
            value = blocks["__somersault__"]["value"]
            assert value[0] == wiki_content.title(page_title)
            assert len(tables(value)) == TABLES[page_id]
            assert layout == wiki_content.blocks_layout()

    def test_budget_table_has_a_footer_row_with_sums(self):
        """The "Gesamt" row is the footer row; its amounts are sum cells."""
        budget = tables(content.budget_page())[0]
        footer = budget["children"][-1]
        assert footer["footer"] is True
        cells = footer["children"]
        assert cell_text(cells[0]) == "Gesamt"
        assert [c.get("calc") for c in cells] == [None, None, "sum", "sum", "sum", None]
        assert cell_text(cells[2]) == "1.455.000 €"
        assert all("footer" not in r for r in budget["children"][:-1])

    def test_budget_table_is_medium(self):
        """Six columns do not fit into the text column: the medium step, like
        a pasted table with six columns (work items 823, 825)."""
        budget, milestones = tables(content.budget_page())
        assert len(budget["children"][0]["children"]) == 6
        assert budget["blockWidth"] == "medium"
        assert "blockWidth" not in milestones

    def test_wide_table_has_nine_columns(self):
        value = content.participants_page()
        wide = tables(value)[1]
        assert len(wide["children"][0]["children"]) == 9

    def test_open_items_can_be_sorted_and_filtered(self):
        """More than five rows (filter), dates out of order, empty cells."""
        open_items = tables(content.participants_page())[2]
        _header, *rows = open_items["children"]
        assert len(rows) > 5
        due = [cell_text(r["children"][2]) for r in rows]
        dated = [d for d in due if d]
        assert "" in due
        assert dated != sorted(dated, key=lambda d: d.split(".")[::-1])
        assert not any(c.get("colSpan") for r in rows for c in r["children"])

    def test_agenda_has_a_merged_cell(self):
        agenda = tables(content.participants_page())[3]
        spans = [c.get("colSpan", 1) for r in agenda["children"] for c in r["children"]]
        assert 2 in spans


class TestWidthsPage:
    """ "Tabellenbreiten": one table per width case (work item 827)."""

    @pytest.fixture(autouse=True)
    def _setup(self):
        self.tables = tables(content.widths_page())

    def width_of(self, node: dict) -> tuple:
        return (node.get("blockWidth"), node.get("tableWidth"), node.get("tableAlign"))

    def test_one_table_per_width(self):
        assert [self.width_of(t) for t in self.tables] == [
            ("default", None, None),
            ("medium", None, None),
            ("layout", None, None),
            ("full", None, None),
            ("default", 960, None),
            ("layout", None, "center"),
            ("default", 1800, None),
        ]

    def test_text_width_table_is_small(self):
        small = self.tables[0]
        assert len(small["children"][0]["children"]) <= 4
        assert sum(small["colSizes"]) == 780

    def test_medium_and_wide_get_the_columns_a_paste_gives_them(self):
        """Medium 6-7 columns, Wide 8-9 (wikiTableWidthPlugin.ts, work items
        823, 825)."""
        medium, wide = (len(t["children"][0]["children"]) for t in self.tables[1:3])
        assert 6 <= medium <= 7
        assert 8 <= wide <= 9

    def test_tables_on_a_wide_step_store_no_column_widths(self):
        """Their columns share the step's width (at most the room); stored
        widths would fix the table at their sum."""
        for node in self.tables:
            if "tableWidth" not in node and node["blockWidth"] != "default":
                assert "colSizes" not in node, node["id"]

    def test_custom_widths_are_the_sum_of_the_columns(self):
        for node in self.tables:
            if "tableWidth" in node:
                assert sum(node["colSizes"]) == node["tableWidth"]
                # Plate never makes a column narrower than 120px.
                assert min(node["colSizes"]) >= 120

    def test_columns_match_the_header(self):
        for node in self.tables:
            header, *rows = node["children"]
            assert all(len(r["children"]) == len(header["children"]) for r in rows), (
                node["id"]
            )
            if "colSizes" in node:
                assert len(node["colSizes"]) == len(header["children"]), node["id"]

    def test_links_to_the_other_table_pages(self):
        targets = {link["url"] for link in links(content.widths_page("/wiki-836/"))}
        assert targets == {
            "/wiki-836/projektbudget-2026",
            "/wiki-836/teilnehmende-konsortialtreffen",
            f"/wiki-836/{csv_content.PAGE_ID}",
        }

    def test_links_default_to_the_greencat_workspace(self):
        assert all(
            link["url"].startswith(f"{content.CONTAINER_PATH}/")
            for link in links(content.widths_page())
        )

    def test_pages_pass_the_container_on(self):
        value = {
            page_id: blocks["__somersault__"]["value"]
            for page_id, _title, blocks, _layout in content.pages("/wiki-836")
        }
        assert {
            link["url"].rsplit("/", 1)[0] for link in links(value["tabellenbreiten"])
        } == {"/wiki-836"}


class TestCreateTableDemoPages:
    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal

    def test_without_workspace_does_nothing(self):
        assert table_demo.create_table_demo_pages(self.portal) == 0

    def test_creates_pages(self, workspace):
        assert table_demo.create_table_demo_pages(self.portal) == 3
        for page_id, page_title in content.PAGES:
            page = workspace[page_id]
            assert page.portal_type == "WikiPage"
            assert page.title == page_title
            assert page.blocks_layout["items"] == [wiki_content.TITLE_BLOCK_ID]
            assert (
                len(tables(page.blocks["__somersault__"]["value"])) == TABLES[page_id]
            )

    def test_is_idempotent(self, workspace):
        assert table_demo.create_table_demo_pages(self.portal) == 0

    def test_creates_only_missing_pages(self, workspace):
        """A site that has the two earlier demo pages gets the new one."""
        table_demo.create_table_demo_pages(self.portal)
        uids = {
            page_id: api.content.get_uuid(workspace[page_id])
            for page_id in ("projektbudget-2026", "teilnehmende-konsortialtreffen")
        }
        with api.env.adopt_roles(["Manager"]):
            api.content.delete(workspace["tabellenbreiten"])
        assert table_demo.create_table_demo_pages(self.portal) == 1
        assert workspace["tabellenbreiten"].title == "Tabellenbreiten"
        for page_id, uid in uids.items():
            assert api.content.get_uuid(workspace[page_id]) == uid
