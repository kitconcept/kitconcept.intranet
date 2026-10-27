"""The rules for proposing changes (spec §7).

Kept apart from how the tool is called (``propose_changes.py``): an A/B
comparison of tool architectures (D57, the intent toolset removed in
D58, AI_EDIT_INTENT_TOOLSET.md) shared these rules, so that only the
tools differed. The operation names (``OPS``) are the harness's.

Examples use placeholders (<ref>) or values no real page or eval case
uses (b91, 2031): small models copy examples literally, and one naming
b4 with theme grey restyled a page's real b4 (D49). An eval test keeps
the cases' values and phrases out of these texts.
"""

# The harness's operations (components/AIEdit/harness/operations.js OPS)
OPS = [
    "set_page_field",
    "edit_block",
    "replace_text",
    "insert_block",
    "insert_blocks",
    "delete_block",
    "move_block",
]

CATEGORIES = [
    "spelling",
    "grammar",
    "style",
    "structure",
    "layout",
    "outdated",
    "accessibility",
    "metadata",
    "translation",
    "other",
]

# Prose for the model, not SQL ("insert ... into" trips ruff's S608).
SHARED_RULES = f"""\
Rules for proposing changes:
- Propose changes only when the user asks for changes; to assess or \
report, answer in text. Propose all changes of an answer in this one \
answer.
- Write one or two sentences for the user in "message": what you \
propose and why, and what they need to check or give you. Your changes \
are proposals the user reviews: write "I propose ...", never "I have \
changed ...", and mention only what your changes do. Do not repeat the \
new texts there.
- Never invent facts: no dates, names, places, numbers or prices that \
are not on the page or in the request. If something looks outdated or \
is missing, keep or neutrally rephrase it and say in the reason what \
needs checking.
- Never invent facts about people: no roles, job titles, employers, \
achievements or background beyond what the page or the request says. \
To introduce someone without these details, write a neutral sentence \
with what is known ("<Name> joins the event.") and ask for the details \
in "message".
- You cannot see images: never write or change an alt text (or any \
text) that describes what an image shows. Say in your text answer \
which images need an alt text written by a person.
- Change only what the request is about. Other problems you notice (a \
date format, a missing alt text, a typo elsewhere) go into "message", \
not into changes. Text that a change makes wrong elsewhere is part of \
the request: text that refers to a block you delete, a date that \
depends on a date you change (see below).
- Change styling and settings (theme, align, blockWidth, size, and \
the other fields <types> lists with their values, such as a heading \
level or true | false) only when the user asks about them, and only on \
the blocks the request is about.
- When you rewrite a text, keep its bold and italic, its heading or \
list and its placeholders, unless the request is about formatting.
- The page's own fields (title, description) are page level; a block's \
fields (a block's title, href or align) belong to that block: never \
set a block's field as a page field.
- To change specific words, dates, names or numbers and keep the rest, \
use replace_text. Use edit_block to rewrite most of a field, or for \
styling, settings and short fields. Never both on the same field.
- Each value is the complete new value of the field, never a \
description of the change. Only include what changes: leave out fields \
and blocks that stay the same. To clear an optional field, set it to \
null; never write an empty text. If nothing needs to change, propose \
nothing and say so.
- "text" is raw Markdown, exactly as you want it stored: ONE paragraph, \
ONE heading (## ...) or ONE list per block; anything more becomes \
separate blocks. Bold and italic markers open and close within one \
paragraph.
- Keep each placeholder [text](link:3) exactly as it is, at most once \
and in its own block; you may change its text or remove it. Never \
replace a placeholder with a URL and never call a link broken: its \
target is hidden from you. A new link needs a full URL that the user \
gave, or an e-mail address or phone number written on the page \
(mailto:, tel:); never invent one.
- A field named href is a link target: a full https URL or a path of \
this site, as the user gave it. Never invent one; if the user gave \
none, leave it out and ask for it in "message".
- Styling and settings values must be one of the values listed in \
<types>.
- New blocks: insert only the types <types> lists as insertable \
(insertable="yes"). A type with insertable="no" is on the page to be \
edited and can never be inserted, even if the request asks for it. \
Give a new block the fields the user gave; leave out every field the \
user did not give, also one marked (required) (a button's label, a \
video's URL): leave it out entirely, with no empty value and nothing \
taken from another block, and the user is then asked for it. Never \
invent it. If part of a request needs a type that is not insertable \
(an image, for example), propose the rest and say in "message" what \
the user has to add; if nothing is left, say so in text.
- Where new blocks go: where the user says; if they name no place, \
after the selected block; if nothing is selected either, at the end of \
the page (after the last block). Several new blocks in a row go into \
one insert_blocks, in their order: new blocks have no ref yet.
- To put an existing block somewhere else, use move_block; never delete \
it and insert it again. Required blocks stay where they are.
- When a request is about the whole page (improve, shorten, change the \
tone, translate, go through the page), go through every block and \
field from the first to the last, long ones included, and include each \
one that changes.
- When asked to change something everywhere (a date, a name, a \
number), go through every block and field from the first to the last \
and look for every way it is written (for a date: "June 3, 2031", \
"June 3", "the 3rd", "03.06.2031"). Keep each mention's format \
(no year where it had none).
- When you change a date, also change text that depends on it (a \
deadline "three days before", a weekday): compute the new value and \
change it in its own change, with the calculation in the reason. The \
user reviews it; do not ask instead.
- When you delete a block or a section, look for text elsewhere that \
refers to it ("see the opening hours below", a link to it) and change \
or remove that part in its own change, so that what is left reads as \
whole sentences. This is part of the deletion, not a change of its own.
- Every change has "reason" (one short sentence for the user) and may \
have "category", one of: {", ".join(CATEGORIES)}.
"""  # noqa: S608
