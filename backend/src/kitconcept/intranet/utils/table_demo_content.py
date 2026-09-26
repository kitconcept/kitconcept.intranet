"""Content of the two Wiki Pages that demonstrate tables.

Pure data, no Plone imports: this module is used by the distribution's
post handler (``table_demo.create_table_demo_pages``, for freshly created
sites) and by ``scripts/table_demo_content.py`` (REST, for existing sites).

Both pages live in the GreenCat workspace next to the history-diff demo
page. "Projektbudget 2026" has a budget table and a milestone table with
marks and links in the cells; "Teilnehmende Konsortialtreffen" has a
contact table and a wide attendance table (nine columns) that scrolls
inside the page.

Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655
"""

# ruff: noqa: RUF001  (typographic dashes in the German content)
from __future__ import annotations

from kitconcept.intranet.utils.wiki_content import blocks
from kitconcept.intranet.utils.wiki_content import blocks_layout
from kitconcept.intranet.utils.wiki_content import heading
from kitconcept.intranet.utils.wiki_content import paragraph
from kitconcept.intranet.utils.wiki_content import table
from kitconcept.intranet.utils.wiki_content import text
from kitconcept.intranet.utils.wiki_content import title


CONTAINER_PATH = "/workspaces/eu-projekt-greencat"


def link(node_id: str, url: str, label: str) -> dict:
    return {"type": "a", "id": node_id, "url": url, "children": [text(label)]}


def budget_page() -> list[dict]:
    page_title = "Projektbudget 2026"
    return [
        title(page_title),
        paragraph(
            "b-intro",
            "Stand der Mittelverwendung im EU-Projekt GreenCat zum 30. Juni 2026. "
            "Die Zahlen stammen aus dem Finanzbericht an den Fördergeber; "
            "Abweichungen über 10 % sind mit dem Projektbüro abzustimmen.",
        ),
        heading("b-h-budget", "Budget nach Arbeitspaketen"),
        table(
            "b-budget",
            [
                "Arbeitspaket",
                "Zuständig",
                "Budget",
                "Verbraucht",
                "Rest",
                "Status",
            ],
            [
                [
                    ("WP1 ", text("Koordination", bold=True)),
                    "Dr. Miriam Engelhardt",
                    "180.000 €",
                    "92.400 €",
                    "87.600 €",
                    "im Plan",
                ],
                [
                    ("WP2 ", text("Katalysator-Screening", bold=True)),
                    "Dr. Sophie Lehner",
                    "420.000 €",
                    "268.900 €",
                    "151.100 €",
                    "im Plan",
                ],
                [
                    ("WP3 ", text("Pilotanlage", bold=True)),
                    "Dr. Clara Beck",
                    "650.000 €",
                    "471.300 €",
                    "178.700 €",
                    ("Abweichung ", text("+12 %", bold=True)),
                ],
                [
                    ("WP4 ", text("Dissemination", bold=True)),
                    "Florian Meier",
                    "95.000 €",
                    "31.200 €",
                    "63.800 €",
                    "im Plan",
                ],
                [
                    ("WP5 ", text("Datenmanagement", bold=True)),
                    "Jonas Keller",
                    "110.000 €",
                    "58.700 €",
                    "51.300 €",
                    "im Plan",
                ],
                [
                    text("Gesamt", bold=True),
                    "",
                    text("1.455.000 €", bold=True),
                    text("922.500 €", bold=True),
                    text("532.500 €", bold=True),
                    "",
                ],
            ],
            col_sizes=[175, 120, 130, 125, 115, 115],
        ),
        paragraph(
            "b-note",
            "Die Mehrkosten in WP3 gehen auf die vorgezogene Beschaffung des "
            "Reaktormoduls zurück und werden durch Einsparungen in WP4 gedeckt.",
        ),
        heading("b-h-meilensteine", "Meilensteine im zweiten Halbjahr"),
        table(
            "b-meilensteine",
            ["Meilenstein", "Termin", "Verantwortlich", "Nachweis"],
            [
                [
                    "M6 – Katalysator-Kandidaten ausgewählt",
                    "31.07.2026",
                    "Dr. Sophie Lehner",
                    (
                        "Bericht D2.3 (",
                        link("b-l-d23", "https://example.org/greencat/d2-3", "Entwurf"),
                        ")",
                    ),
                ],
                [
                    "M7 – Pilotanlage in Betrieb",
                    "15.10.2026",
                    "Dr. Clara Beck",
                    "Abnahmeprotokoll",
                ],
                [
                    "M8 – Zwischenbericht eingereicht",
                    "30.11.2026",
                    "Dr. Miriam Engelhardt",
                    (
                        "Fördergeber-Portal, ",
                        link(
                            "b-l-portal",
                            "https://example.org/greencat/portal",
                            "Einreichung",
                        ),
                    ),
                ],
                [
                    "M9 – Öffentlicher Workshop",
                    "10.12.2026",
                    "Florian Meier",
                    "Teilnehmerliste, Folien",
                ],
            ],
            col_sizes=[250, 100, 170, 260],
        ),
    ]


def participants_page() -> list[dict]:
    page_title = "Teilnehmende Konsortialtreffen"
    sessions = ["KW 26", "KW 29", "KW 32", "KW 35", "KW 38", "KW 41", "KW 44", "KW 47"]
    people = [
        (
            "Dr. Miriam Engelhardt",
            "DFNT",
            "Koordination",
            "engelhardt@example.org",
            "x x x x x x x x",
        ),
        ("Dr. Sophie Lehner", "DFNT", "WP2", "lehner@example.org", "x x – x x x x x"),
        ("Dr. Clara Beck", "TU Aachen", "WP3", "beck@example.org", "x x x x – x x x"),
        (
            "Florian Meier",
            "DFNT",
            "WP4, Protokoll",
            "meier@example.org",
            "x x x x x x – x",
        ),
        ("Jonas Keller", "Uni Leiden", "WP5", "keller@example.org", "– x x x x x x x"),
        (
            "Prof. Anna Vogt",
            "TU Aachen",
            "Beirat",
            "vogt@example.org",
            "x – – x – – x –",
        ),
        (
            "Dr. Luca Moretti",
            "Politecnico di Milano",
            "Industriepartner",
            "moretti@example.org",
            "x x x – x x x x",
        ),
    ]
    return [
        title(page_title),
        paragraph(
            "t-intro",
            "Kontaktdaten der ständigen Teilnehmenden und die Anwesenheit bei den "
            "Konsortialtreffen 2026. Änderungen bitte direkt in der Tabelle "
            "eintragen; die Liste wird vor jedem Treffen exportiert.",
        ),
        heading("t-h-kontakte", "Kontakte"),
        table(
            "t-kontakte",
            ["Name", "Institution", "Rolle", "E-Mail"],
            [
                [
                    text(name, bold=True),
                    institution,
                    role,
                    (link(f"t-l-{i}", f"mailto:{mail}", mail),),
                ]
                for i, (name, institution, role, mail, _) in enumerate(people)
            ],
            col_sizes=[180, 170, 150, 280],
        ),
        heading("t-h-anwesenheit", "Anwesenheit 2026"),
        paragraph(
            "t-anwesenheit-note",
            "x = anwesend, – = entschuldigt. Die Tabelle ist breiter als die Seite "
            "und lässt sich seitlich scrollen.",
        ),
        table(
            "t-anwesenheit",
            ["Name", *sessions],
            [[name, *attendance.split(" ")] for name, _, _, _, attendance in people],
        ),
    ]


# (page id, page title, builder)
PAGES: list[tuple[str, str]] = [
    ("projektbudget-2026", "Projektbudget 2026"),
    ("teilnehmende-konsortialtreffen", "Teilnehmende Konsortialtreffen"),
]
BUILDERS = {
    "projektbudget-2026": budget_page,
    "teilnehmende-konsortialtreffen": participants_page,
}


def pages() -> list[tuple[str, str, dict, dict]]:
    """(id, title, blocks, blocks_layout) for every demo page."""
    return [
        (page_id, page_title, blocks(BUILDERS[page_id]()), blocks_layout())
        for page_id, page_title in PAGES
    ]
