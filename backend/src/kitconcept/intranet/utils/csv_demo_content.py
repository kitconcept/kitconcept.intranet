"""Content of the CSV table demo: a CSV file and the Wiki Page that shows it.

Pure data, no Plone imports: used by the distribution's post handler
(``csv_demo.create_csv_demo``) for freshly created sites. Both objects live
in the GreenCat workspace next to the table demo pages: the file
"projektbudget-2026.csv" and the page "Projektbudget aus CSV-Datei" with a
CSV table block that reads the file whenever the page is shown. The file has
more than five rows, so the view offers the filter field, and a column of
plain numbers, so sorting by budget is numeric.

Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/751
"""

from __future__ import annotations

from kitconcept.intranet.utils.wiki_content import blocks
from kitconcept.intranet.utils.wiki_content import blocks_layout
from kitconcept.intranet.utils.wiki_content import node
from kitconcept.intranet.utils.wiki_content import paragraph
from kitconcept.intranet.utils.wiki_content import text
from kitconcept.intranet.utils.wiki_content import title


CONTAINER_PATH = "/workspaces/eu-projekt-greencat"

FILE_ID = "projektbudget-2026.csv"
FILE_TITLE = "Projektbudget 2026 (CSV)"
FILE_CONTENT_TYPE = "text/csv"
FILE_TEXT = """Arbeitspaket;Budget;Verantwortlich;Status
WP1 Koordination;180000;Dr. Miriam Engelhardt;im Plan
WP2 Katalysator-Screening;420000;Dr. Sophie Lehner;im Plan
WP3 Pilotanlage;650000;Dr. Clara Beck;Abweichung +12 %
WP4 Dissemination;95000;Florian Meier;im Plan
WP5 Datenmanagement;110000;Jonas Keller;im Plan
WP6 Transfer;45000;Lena Fischer;offen
WP7 Abschlussbericht;15000;Dr. Miriam Engelhardt;offen
"""

PAGE_ID = "projektbudget-aus-csv"
PAGE_TITLE = "Projektbudget aus CSV-Datei"


def csv_table_block(node_id: str, url: str) -> dict:
    """A CSV table block (Plone block inside the Plate value)."""
    return node("ploneBlock", node_id, [text("")], **{"@type": "csvtable", "url": url})


def page() -> list[dict]:
    return [
        title(PAGE_TITLE),
        paragraph(
            "csv-intro",
            "Diese Tabelle kommt nicht aus der Seite, sondern aus der Datei ",
            text(FILE_TITLE, italic=True),
            " im Workspace. Sie wird bei jedem Aufruf der Seite neu aus der "
            "Datei gelesen: Wer die Datei ersetzt, aktualisiert die Tabelle, "
            "ohne die Seite zu bearbeiten. Sortieren und Filtern funktionieren "
            "wie bei jeder Wiki-Tabelle.",
        ),
        csv_table_block("csv-block", f"{CONTAINER_PATH}/{FILE_ID}"),
        paragraph(
            "csv-outro",
            "Die Datei liegt als Beispiel neben dieser Seite; im Editor wird "
            "sie über das Feld „CSV-Datei“ in der Seitenleiste ausgewählt.",
        ),
    ]


def page_fields() -> tuple[str, str, dict, dict]:
    """(id, title, blocks, blocks_layout) of the demo page."""
    return PAGE_ID, PAGE_TITLE, blocks(page()), blocks_layout()
