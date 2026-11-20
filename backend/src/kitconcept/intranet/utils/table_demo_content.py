"""Content of the three Wiki Pages that demonstrate tables.

Pure data, no Plone imports: this module is used by the distribution's
post handler (``table_demo.create_table_demo_pages``, for freshly created
sites) and by ``scripts/table_demo_content.py`` (REST, for existing sites).

The pages live in the GreenCat workspace next to the history-diff demo
page. "Projektbudget 2026" has a budget table (six columns, shown wide)
and a milestone table with marks and links in the cells; "Teilnehmende
Konsortialtreffen" has a contact table, a wide attendance table (nine
columns) that scrolls inside the page, a list of open items and the agenda
of the next meeting.

The open items show sorting and filtering in the view: more than five rows
(the filter field appears), due dates out of order, a German decimal
column and empty cells (sorted last). The agenda has a merged cell, so its
columns cannot be moved and it has no sort buttons or filter.

"Tabellenbreiten" shows every width a table can have, one table per case:
the text width, the steps Medium, Wide and Full width, a custom width as
the resize handle stores it, a centred table and a table wider than the
page that scrolls into the area left of the text. It links to the other
two pages and to the CSV table demo (``csv_demo_content``) for the rest of
the table features.

Tickets: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655,
https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/666,
https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/823,
https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/827
"""

# ruff: noqa: RUF001  (typographic dashes in the German content)
from __future__ import annotations

from kitconcept.intranet.utils.csv_demo_content import PAGE_ID as CSV_PAGE_ID
from kitconcept.intranet.utils.wiki_content import Span
from kitconcept.intranet.utils.wiki_content import Sum
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
            ],
            footer=[
                "Gesamt",
                "",
                Sum("1.455.000 €"),
                Sum("922.500 €"),
                Sum("532.500 €"),
                "",
            ],
            col_sizes=[175, 120, 130, 125, 115, 115],
            # Six columns: the medium step, as a pasted table with six
            # columns gets it (work items 823, 825).
            width="medium",
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
            col_sizes=[230, 125, 165, 260],
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
        heading("t-h-offene-punkte", "Offene Punkte"),
        paragraph(
            "t-offene-punkte-note",
            "Aus den Treffen KW 35 und KW 38. Aufwand in Personenstunden; "
            "ohne Termin = nächstes Treffen.",
        ),
        table(
            "t-offene-punkte",
            ["Aufgabe", "Zuständig", "Fällig", "Aufwand (h)", "Status"],
            [
                [
                    "Lieferverzug Reaktormodul klären",
                    "Dr. Clara Beck",
                    "15.10.2026",
                    "6",
                    "offen",
                ],
                [
                    "Protokoll KW 38 freigeben",
                    "Florian Meier",
                    "02.10.2026",
                    "0,5",
                    "erledigt",
                ],
                [
                    "Datenmanagementplan aktualisieren",
                    "Jonas Keller",
                    "30.11.2026",
                    "12",
                    "in Arbeit",
                ],
                [
                    "Termin für die Beiratssitzung finden",
                    "Prof. Anna Vogt",
                    "",
                    "1",
                    "offen",
                ],
                [
                    "Katalysator-Proben nach Mailand senden",
                    "Dr. Sophie Lehner",
                    "09.10.2026",
                    "3,5",
                    "in Arbeit",
                ],
                [
                    "Einladungen zum Workshop versenden",
                    "Florian Meier",
                    "16.11.2026",
                    "2",
                    "offen",
                ],
                [
                    "Kostenabweichung WP3 begründen",
                    "Dr. Miriam Engelhardt",
                    "20.10.2026",
                    "",
                    "offen",
                ],
                [
                    "Vereinbarung mit dem Industriepartner prüfen",
                    "Dr. Luca Moretti",
                    "31.10.2026",
                    "8",
                    "in Arbeit",
                ],
            ],
            col_sizes=[255, 170, 125, 120, 110],
        ),
        heading("t-h-agenda", "Agenda Konsortialtreffen KW 44"),
        table(
            "t-agenda",
            ["Zeit", "Thema", "Leitung"],
            [
                ["09:30", "Begrüßung, Stand des Projekts", "Dr. Miriam Engelhardt"],
                [
                    "10:00",
                    "Ergebnisse Katalysator-Screening und Pilotanlage",
                    "Dr. Sophie Lehner, Dr. Clara Beck",
                ],
                ["11:30", "Datenmanagementplan", "Jonas Keller"],
                ["12:30", Span(text("Mittagspause", italic=True), cols=2)],
                ["13:30", "Offene Punkte, nächste Schritte", "Florian Meier"],
            ],
            col_sizes=[90, 430, 260],
        ),
    ]


MONTHS = [
    "Jan",
    "Feb",
    "Mär",
    "Apr",
    "Mai",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Okt",
    "Nov",
    "Dez",
]


def widths_page(container: str = CONTAINER_PATH) -> list[dict]:
    """Every width a wiki table can have, one table per case (work item 827).

    The cases the other pages show already (footer sums, a table that
    scrolls in the text column, sorting and filtering, a merged cell, the
    CSV table) are linked at the end; ``container`` is the path of the
    workspace the pages live in, for those links.

    The tables on a step wider than the text store no column widths, like
    a pasted table: their columns share the step's width, which is never
    more than the room the page has. Column widths stored for a step are
    fixed widths, so a table stored at 1440px on a big screen would scroll
    on a smaller one instead of showing the step.
    """
    page_title = "Tabellenbreiten"
    path = container.rstrip("/")
    plan_2027 = {
        "WP1 Koordination": {
            "Jan": "Treffen KW 3",
            "Mär": "Review Brüssel",
            "Jun": "Bericht M30",
            "Sep": "Treffen KW 38",
            "Dez": "Schlussbericht",
        },
        "WP2 Katalysator-Screening": {
            "Jan": "Runde 4",
            "Feb": "Runde 4",
            "Mär": "Auswertung",
            "Apr": "Bericht D2.4",
            "Mai": "Summer School",
        },
        "WP3 Pilotanlage": {
            "Jan": "Wartung",
            **dict.fromkeys(MONTHS[1:7], "Dauerbetrieb"),
            "Aug": "Auswertung",
            "Okt": "Bericht D3.5",
        },
        "WP4 Dissemination": {
            "Mär": "Newsletter",
            "Mai": "Summer School",
            "Jun": "Newsletter",
            "Sep": "Abschlussworkshop",
            "Nov": "Broschüre",
        },
        "WP5 Datenmanagement": {
            "Feb": "DMP Version 3",
            "Jun": "Daten auf Zenodo",
            "Dez": "Archivierung",
        },
    }
    return [
        title(page_title),
        paragraph(
            "w-intro",
            "Diese Seite zeigt untereinander alle Breiten, die eine Tabelle im "
            "Wiki haben kann. Im Editor stellt das Menü ",
            text("Breite", bold=True),
            " in der Werkzeugleiste einer Tabelle die Stufe ein (Lesespalte, "
            "Mittel, Breit, Vollbreite); der Griff am rechten Rand der Tabelle (",
            text("Tabellenbreite ändern", italic=True),
            ") zieht sie auf eine eigene Breite. Die übrigen Tabellenfunktionen "
            "sind am Ende der Seite verlinkt.",
        ),
        heading("w-h-lesespalte", "Lesespalte"),
        paragraph(
            "w-lesespalte-note",
            "Eine kleine Tabelle in der Breite des Textes (780 px), wie jede "
            "neue Tabelle sie bekommt. Ziehen Sie die Grenze zwischen zwei "
            "Spalten: die eine Spalte wird breiter, die andere schmaler, die "
            "Tabelle bleibt gleich breit.",
        ),
        table(
            "w-lesespalte",
            ["Aufgabe im Dezember", "Zuständig", "Fällig", "Status"],
            [
                [
                    "Anlagen zum Zwischenbericht nachreichen",
                    "Dr. Miriam Engelhardt",
                    "04.12.2026",
                    "erledigt",
                ],
                [
                    "Stundenzettel November abzeichnen",
                    "Leitungen der Arbeitspakete",
                    "08.12.2026",
                    "erledigt",
                ],
                [
                    "Laborbetrieb über die Feiertage planen",
                    "Dr. Clara Beck",
                    "11.12.2026",
                    "offen",
                ],
                [
                    "Folien des Workshops veröffentlichen",
                    "Florian Meier",
                    "14.12.2026",
                    "offen",
                ],
                [
                    "Jahresplanung 2027 abstimmen",
                    "Dr. Miriam Engelhardt",
                    "18.12.2026",
                    "offen",
                ],
            ],
            col_sizes=[300, 220, 130, 130],
            width="default",
        ),
        heading("w-h-mittel", "Mittel"),
        paragraph(
            "w-mittel-note",
            "Sechs Spalten sind in der Lesespalte zu eng: Stufe „Mittel“ "
            "(1040 px). Eine eingefügte Tabelle mit sechs oder sieben Spalten "
            "bekommt diese Stufe von selbst.",
        ),
        table(
            "w-mittel",
            ["Name", "Ziel", "Zeitraum", "Anlass", "Kosten", "Genehmigt"],
            [
                [
                    "Dr. Sophie Lehner",
                    "Mailand",
                    "12.–14.10.2026",
                    "Probenübergabe am Politecnico",
                    "1.240 €",
                    "ja",
                ],
                [
                    "Dr. Clara Beck",
                    "Aachen",
                    "21.–22.10.2026",
                    "Abnahme des Reaktormoduls",
                    "380 €",
                    "ja",
                ],
                [
                    "Florian Meier",
                    "Brüssel",
                    "05.–06.11.2026",
                    "Infotag Cluster 5",
                    "690 €",
                    "ja",
                ],
                [
                    "Jonas Keller",
                    "Leiden",
                    "17.–19.11.2026",
                    "FAIR-Workshop",
                    "910 €",
                    "ja",
                ],
                [
                    "Dr. Miriam Engelhardt",
                    "Brüssel",
                    "26.11.2026",
                    "Projektreview",
                    "450 €",
                    "beantragt",
                ],
            ],
            width="medium",
        ),
        heading("w-h-breit", "Breit"),
        paragraph(
            "w-breit-note",
            "Stufe „Breit“ (1440 px, auf kleineren Bildschirmen so breit wie "
            "die Seite), die Stufe einer eingefügten Tabelle mit acht oder "
            "neun Spalten. Belegung der Laborgeräte in KW 49.",
        ),
        table(
            "w-breit",
            [
                "Gerät",
                "Raum",
                "Mo 30.11.",
                "Di 01.12.",
                "Mi 02.12.",
                "Do 03.12.",
                "Fr 04.12.",
                "Kontakt",
            ],
            [
                [
                    "GC-MS",
                    "B 2.14",
                    "Lehner",
                    "Lehner",
                    "",
                    "Moretti (Gast)",
                    "Lehner",
                    "Dr. Sophie Lehner",
                ],
                [
                    "REM",
                    "B 0.08",
                    "Beck",
                    "",
                    "Beck",
                    "Beck",
                    text("Wartung", italic=True),
                    "Dr. Clara Beck",
                ],
                [
                    "Pilotreaktor",
                    "Halle C",
                    "Beck",
                    "Beck",
                    "Beck",
                    "Beck",
                    "Beck",
                    "Dr. Clara Beck",
                ],
                [
                    "XRD",
                    "B 2.03",
                    "",
                    "Hoffmann",
                    "Hoffmann",
                    "",
                    "",
                    "Tim Hoffmann",
                ],
                [
                    "Glovebox",
                    "B 2.11",
                    "Hoffmann",
                    "",
                    "Lehner",
                    "",
                    "Hoffmann",
                    "Tim Hoffmann",
                ],
            ],
            width="layout",
        ),
        heading("w-h-vollbreite", "Vollbreite"),
        paragraph(
            "w-vollbreite-note",
            "So breit wie die Seite; eine eingefügte Tabelle mit zehn oder mehr "
            "Spalten bekommt diese Stufe von selbst. Personaleinsatz Juli bis "
            "Dezember 2026 in Personenmonaten.",
        ),
        table(
            "w-vollbreite",
            [
                "Name",
                "Partner",
                "Jul",
                "Aug",
                "Sep",
                "Okt",
                "Nov",
                "Dez",
                "Summe",
            ],
            [
                [name, institution, *months.split(" ")]
                for name, institution, months in [
                    ("Dr. Miriam Engelhardt", "DFNT", "0,5 0,5 0,5 0,5 0,5 0,5 3,0"),
                    ("Dr. Sophie Lehner", "DFNT", "1,0 0,5 1,0 1,0 1,0 0,5 5,0"),
                    ("Dr. Clara Beck", "TU Aachen", "1,0 1,0 1,0 1,0 1,0 0,5 5,5"),
                    ("Florian Meier", "DFNT", "0,5 0,2 0,5 0,5 0,8 0,5 3,0"),
                    ("Jonas Keller", "Uni Leiden", "0,5 0,5 0,5 0,5 0,5 0,3 2,8"),
                    (
                        "Dr. Luca Moretti",
                        "Politecnico di Milano",
                        "0,3 – 0,3 0,5 0,3 0,2 1,6",
                    ),
                ]
            ],
            width="full",
        ),
        heading("w-h-eigene-breite", "Eigene Breite"),
        paragraph(
            "w-eigene-breite-note",
            "Diese Tabelle wurde mit dem Griff am rechten Rand auf 960 px "
            "gezogen: sie speichert ihre Breite in Pixeln statt einer Stufe. "
            "Der äußere Griff verändert alle Spalten zugleich, die Kante der "
            "letzten Spalte nur diese Spalte. Endet ein Zug genau auf einer "
            "Stufe, rastet die Tabelle dort ein; ein Klick auf eine Stufe im "
            "Menü „Breite“ setzt die eigene Breite zurück.",
        ),
        table(
            "w-eigene-breite",
            ["Datum", "Veranstaltung 2027", "Ort", "Zuständig"],
            [
                [
                    "19.01.2027",
                    "Konsortialtreffen KW 3",
                    "TU Aachen",
                    "Dr. Miriam Engelhardt",
                ],
                [
                    "16.03.2027",
                    "Projektreview mit dem Fördergeber",
                    "Brüssel",
                    "Dr. Miriam Engelhardt",
                ],
                [
                    "04.05.2027",
                    "Sommerschule Katalyse",
                    "Politecnico di Milano",
                    "Dr. Luca Moretti",
                ],
                ["22.09.2027", "Abschlussworkshop", "online", "Florian Meier"],
            ],
            col_sizes=[140, 340, 220, 260],
            table_width=960,
        ),
        heading("w-h-zentriert", "Zentriert"),
        paragraph(
            "w-zentriert-note",
            "Eine breite Tabelle, die mittig auf der Seite steht statt bündig "
            "mit dem Text: Schalter „Tabelle zentrieren“ im Menü „Breite“. "
            "Auch beim Ziehen am Griff bleibt sie zentriert.",
        ),
        table(
            "w-zentriert",
            [
                "Probe",
                "Charge",
                "Empfänger",
                "Institution",
                "Versand",
                "Ankunft",
                "Status",
            ],
            [
                [
                    "Katalysator K-17",
                    "2026-41",
                    "Dr. Luca Moretti",
                    "Politecnico di Milano",
                    "09.10.2026",
                    "12.10.2026",
                    "angekommen",
                ],
                [
                    "Katalysator K-21",
                    "2026-44",
                    "Dr. Clara Beck",
                    "TU Aachen",
                    "02.11.2026",
                    "03.11.2026",
                    "angekommen",
                ],
                [
                    "Trägermaterial T-3",
                    "2026-45",
                    "Prof. Anna Vogt",
                    "TU Aachen",
                    "10.11.2026",
                    "",
                    "unterwegs",
                ],
                [
                    "Referenzprobe R-1",
                    "2026-47",
                    "Dr. Luca Moretti",
                    "Politecnico di Milano",
                    "23.11.2026",
                    "",
                    "geplant",
                ],
            ],
            width="layout",
            align="center",
        ),
        heading("w-h-ueberbreit", "Breiter als die Seite"),
        paragraph(
            "w-ueberbreit-note",
            "Mit einer eigenen Breite von 1800 px ist diese Tabelle breiter als "
            "die Seite: sie scrollt seitlich in ihrem Rahmen, und der Rahmen "
            "nutzt auch den Platz links neben dem Text. Zum Ausprobieren den "
            "Griff über den Rand der Seite hinaus ziehen und festhalten: die "
            "Tabelle wächst weiter, nahe am Rand langsam, weiter draußen "
            "schnell.",
        ),
        table(
            "w-ueberbreit",
            ["Jahresplanung 2027", *MONTHS],
            [
                [package, *(entries.get(month, "") for month in MONTHS)]
                for package, entries in plan_2027.items()
            ],
            col_sizes=[240, *([130] * len(MONTHS))],
            table_width=1800,
        ),
        heading("w-h-weitere", "Weitere Tabellenfunktionen"),
        paragraph(
            "w-weitere-budget",
            link("w-l-budget", f"{path}/projektbudget-2026", "Projektbudget 2026"),
            ": Summen in der Fußzeile, die sich beim Bearbeiten neu berechnen, "
            "und Links in den Zellen.",
        ),
        paragraph(
            "w-weitere-teilnehmende",
            link(
                "w-l-teilnehmende",
                f"{path}/teilnehmende-konsortialtreffen",
                "Teilnehmende Konsortialtreffen",
            ),
            ": eine Tabelle mit neun Spalten in der Lesespalte, die in ihrem "
            "Rahmen scrollt (auf dem Telefon scrollen so alle breiten "
            "Tabellen), Sortieren und Filtern bei den offenen Punkten und eine "
            "verbundene Zelle unter der Kopfzeile in der Agenda.",
        ),
        paragraph(
            "w-weitere-csv",
            link("w-l-csv", f"{path}/{CSV_PAGE_ID}", "Projektbudget aus CSV-Datei"),
            ": eine Tabelle, die bei jedem Aufruf aus einer CSV-Datei im "
            "Workspace gelesen wird.",
        ),
    ]


# (page id, page title)
PAGES: list[tuple[str, str]] = [
    ("projektbudget-2026", "Projektbudget 2026"),
    ("teilnehmende-konsortialtreffen", "Teilnehmende Konsortialtreffen"),
    ("tabellenbreiten", "Tabellenbreiten"),
]
# Page id -> builder, called with the path of the container (for links
# between the pages).
BUILDERS = {
    "projektbudget-2026": lambda _container: budget_page(),
    "teilnehmende-konsortialtreffen": lambda _container: participants_page(),
    "tabellenbreiten": widths_page,
}


def pages(container: str = CONTAINER_PATH) -> list[tuple[str, str, dict, dict]]:
    """(id, title, blocks, blocks_layout) for every demo page, in
    ``container`` (the path of the workspace)."""
    return [
        (page_id, page_title, blocks(BUILDERS[page_id](container)), blocks_layout())
        for page_id, page_title in PAGES
    ]
