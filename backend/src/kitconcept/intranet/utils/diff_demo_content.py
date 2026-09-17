"""Content of the Wiki Page that demonstrates the history diff.

Pure data, no Plone imports: this module is used by the distribution's
post handler (``diff_demo.create_demo_page``, for freshly created sites)
and by ``scripts/diff_demo_content.py`` (REST, for existing sites).

Exported content carries no version history, so the page is not part of
the example content dump; both users create it from ``version_0`` and
apply the three edits below, giving four versions with change notes.
Every edit shows one kind of change in the diff view: word-level text
changes and a new paragraph, an added list item and a changed callout,
changed block settings only. Tables are deliberately not part of the demo
page; they are covered by the wiki table work (GitLab #655).

Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/642
"""

from __future__ import annotations

import copy

PAGE_ID = "jour-fixe-kw-38"
PAGE_TITLE = "Jour fixe KW 38"
CONTAINER_PATH = "/workspaces/eu-projekt-greencat"

# The editor writes these on every block; without them a later change would
# read "not set → Centred" instead of "Left → Centred" in the diff.
BLOCK_DEFAULTS = {"align": "start", "blockWidth": "default"}


def text(value: str, **marks) -> dict:
    return {"text": value, **marks}


def node(kind: str, node_id: str, children: list, **props) -> dict:
    return {"type": kind, "id": node_id, "children": children, **props}


def paragraph(node_id: str, *runs, **props) -> dict:
    children = [text(run) if isinstance(run, str) else run for run in runs]
    return node("p", node_id, children, **{**BLOCK_DEFAULTS, **props})


def heading(node_id: str, value: str) -> dict:
    return node("h2", node_id, [text(value)], **BLOCK_DEFAULTS)


def list_item(node_id: str, value: str, number: int) -> dict:
    return node(
        "p",
        node_id,
        [text(value)],
        indent=1,
        listStyleType="decimal",
        listStart=number,
    )


def bullet_item(node_id: str, value: str) -> dict:
    return node("p", node_id, [text(value)], indent=1, listStyleType="disc")


def callout(node_id: str, value: str, variant: str = "info") -> dict:
    return node("callout", node_id, [text(value)], variant=variant, icon="💡")


def version_0() -> list[dict]:
    return [
        node("title", "title", [text(PAGE_TITLE)]),
        heading("h-teilnehmer", "Teilnehmer"),
        paragraph(
            "p-teilnehmer",
            "Dr. Miriam Engelhardt, Dr. Sophie Lehner, Dr. Clara Beck, "
            "Florian Meier (Protokoll).",
        ),
        heading("h-agenda", "Agenda"),
        list_item("a1", "Statusbericht Arbeitspaket 2: Katalysator-Synthese", 1),
        list_item("a2", "Ergebnisse der XPS-Messreihe", 2),
        list_item("a3", "Vorbereitung Zwischenbericht an den Fördergeber", 3),
        heading("h-diskussion", "Diskussion"),
        paragraph(
            "p-ap2",
            "AP2 liegt im Zeitplan. Die Ausbeute der Charge 47 liegt bei 68 %, "
            "die Optimierung der Kalzinierungstemperatur läuft.",
        ),
        paragraph(
            "p-xps",
            "Die XPS-Messreihe zeigt ein unerwartetes Signal bei 285 eV, "
            "vermutlich eine Kohlenstoff-Kontamination.",
        ),
        callout(
            "co-hinweis", "Referenzproben bitte bis Freitag im Labor 1.14 abgeben."
        ),
        heading("h-aufgaben", "Aufgaben"),
        bullet_item(
            "t-miriam", "Miriam: Syntheseprotokoll v3 dokumentieren (bis 25.09.)"
        ),
        bullet_item(
            "t-sophie", "Sophie: XPS-Messung mit Referenzprobe wiederholen (bis 25.09.)"
        ),
        paragraph("p-naechstes", "Nächstes Treffen: 1. Oktober 2026, Raum B2.104."),
    ]


def version_1(previous: list[dict]) -> list[dict]:
    """Word-level text changes and a new paragraph."""
    value = copy.deepcopy(previous)
    by_id = {n.get("id"): n for n in value}
    by_id["p-ap2"]["children"][0]["text"] = (
        "AP2 liegt im Zeitplan. Die Ausbeute der Charge 47 liegt bei 71 %, "
        "die Optimierung der Kalzinierungstemperatur ist abgeschlossen."
    )
    index = value.index(by_id["p-xps"]) + 1
    value.insert(
        index,
        paragraph(
            "p-beschluss",
            "Beschluss: Die Messung wird mit einer gereinigten Probe wiederholt; "
            "Sophie koordiniert die Terminvergabe am Spektrometer.",
        ),
    )
    return value


def version_2(previous: list[dict]) -> list[dict]:
    """A new list item and a changed callout."""
    value = copy.deepcopy(previous)
    by_id = {n.get("id"): n for n in value}
    index = value.index(by_id["t-sophie"]) + 1
    value.insert(
        index,
        bullet_item(
            "t-clara", "Clara: Entwurf Zwischenbericht Kapitel 1 und 2 (bis 10.10.)"
        ),
    )
    by_id["co-hinweis"]["children"][0]["text"] = (
        "Referenzproben bitte bis Donnerstag im Labor 1.14 abgeben."
    )
    by_id["co-hinweis"]["variant"] = "warning"
    return value


def version_3(previous: list[dict]) -> list[dict]:
    """Changed block settings only: alignment and width."""
    value = copy.deepcopy(previous)
    by_id = {n.get("id"): n for n in value}
    by_id["h-diskussion"]["align"] = "center"
    by_id["p-naechstes"]["blockWidth"] = "wide"
    return value


# (builder, change note); the first entry is the initial content.
VERSIONS: list[tuple] = [
    (version_0, None),
    (
        version_1,
        "Ausbeute aktualisiert, Beschluss zur Wiederholung der Messung ergänzt",
    ),
    (version_2, "Aufgabe für Clara ergänzt, Abgabefrist der Proben vorgezogen"),
    (version_3, "Layout angepasst: Überschrift zentriert, Termin in voller Breite"),
]


def blocks(value: list[dict]) -> dict:
    """The ``blocks`` field of a Wiki Page holding ``value`` as Plate content."""
    return {"__somersault__": {"@type": "__somersault__", "value": value}}


def edits() -> list[tuple[list[dict], str]]:
    """The three edits after the initial content: (new value, change note)."""
    value = version_0()
    result = []
    for build, note in VERSIONS[1:]:
        value = build(value)
        result.append((value, note))
    return result
