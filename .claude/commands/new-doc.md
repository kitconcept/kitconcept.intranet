Generate documentation for the following feature or module: $ARGUMENTS

---

## STEP 1 — Analyze the code first (MANDATORY)

Before writing anything:

1. Find all files related to `$ARGUMENTS`:
   - components, hooks, utils, services, types
   - Look in `frontend/packages/` for frontend/package-level code
2. Read ALL of them.
3. List each module and its responsibility.
4. Do NOT document anything you have not read in the code.
5. Do NOT assume or invent behavior. If something is unclear, note it.

---

## STEP 2 — Classify each document (MANDATORY)

For each module or task you identify, decide BEFORE writing:

- `doc_type`: exactly one of `reference` | `how-to` | `tutorial` | `explanation`
- `audience`: `admin` | `editor` | `developer`
- `location`: use the decision trees below

### Doc type decision tree

```
Is the reader learning something new?
├── Yes → Is it a guided, hands-on experience?
│         ├── Yes → TUTORIAL
│         └── No  → EXPLANATION
└── No  → Are they trying to accomplish a task?
          ├── Yes → HOW-TO
          └── No  → REFERENCE  ← DEFAULT
```

Rules:
- React component, hook, API, utility → `reference` (DEFAULT)
- Task a developer needs to accomplish → `how-to`
- Concepts, architecture, design decisions → `explanation`
- Step-by-step learning path for beginners → `tutorial`
- When unsure → use `reference`
- NEVER mix types in one document

### Audience decision tree

```
Does the reader need to write code to use this information?
├── Yes → audience: developer  →  location: docs/docs/developer/
└── No  → Who configures it?
          ├── System-level settings, user management → audience: admin
          └── Creates/edits content               → audience: editor
          Both go in root user docs (docs/docs/)
```

### Location map

**User docs** (admins + editors — no code needed):

| Doc type | Location |
|----------|----------|
| Tutorial | `docs/docs/tutorials/` |
| How-to — content | `docs/docs/how-to-guides/content/` |
| How-to — feedback | `docs/docs/how-to-guides/feedback/` |
| How-to — engagement | `docs/docs/how-to-guides/engagement/` |
| How-to — settings | `docs/docs/how-to-guides/settings/` |
| How-to — authentication | `docs/docs/how-to-guides/authentication/` |
| Reference | `docs/docs/reference/` |
| Explanation/concepts | `docs/docs/concepts/` |

**Developer docs** (writing code required):

| Doc type | Location |
|----------|----------|
| Getting started | `docs/docs/developer/getting-started/` |
| Tutorial | `docs/docs/developer/tutorials/` |
| How-to | `docs/docs/developer/how-to-guides/` |
| Reference — API endpoint | `docs/docs/developer/reference/api/` |
| Reference — behavior/schema | `docs/docs/developer/reference/behaviors/` |
| Reference — component | `docs/docs/developer/reference/components/` |
| Reference — registry/settings | `docs/docs/developer/reference/` |
| Explanation/concepts | `docs/docs/developer/concepts/` |

**Decision rule for reference:** If someone needs to write code to use the information → `developer/reference/`. If they configure it through the UI → `reference/`.

### File naming conventions

- Folders: lowercase, hyphens — `how-to-guides/`
- Files: lowercase, hyphens — `configure-feedback.md`
- Index files: always `index.md`
- How-to filenames: action-focused — `enable-likes.md`
- Reference filenames: noun-based — `control-panel.md`
- Create a subdirectory only when a topic has 4+ related documents

---

## STEP 3 — Apply title rules (MANDATORY for ALL doc types)

- Capitalize the first word and proper nouns only. All other words are lowercase.
- DO NOT use title case (e.g. NOT "Configure The Search Settings")
- For **how-to** titles:
  - DO NOT start with "How to" — it is already in the how-to section
  - DO start with a present-tense verb: "Configure", "Enable", "Set up", "Upload", "Add", "Create"
  - DO NOT use a gerund as the first word (NOT "Configuring search settings")
  - DO NOT use a noun only (NOT "Search settings")
- For **reference** titles: use the name of the thing (component, hook, API)
- For **explanation** titles: use the concept name, lowercase except first word
- For **tutorial** titles: start with a present-tense verb describing what the learner builds

**Good how-to title examples:**
- `Set up OIDC authentication`
- `Configure search settings`
- `Enable likes and ratings`
- `Upload files by drag and drop`

**Bad how-to title examples (never do these):**
- `How to Configure Search Settings` — has "How to" + wrong capitalization
- `Configuring search settings` — gerund opener
- `Search Settings` — noun only, no verb, wrong capitalization
- `Configure Search Settings` — wrong capitalization

---

## STEP 4 — Write each document using the correct template

All documents use MyST Markdown frontmatter. The `description` field (max 160 chars) is used for search and SEO.

---

### Template A — Reference, developer

```md
---
myst:
  html_meta:
    description: "[Short technical description for search, max 160 chars]"
    keywords: "[comma, separated, keywords]"
doc_type: reference
audience: developer
---

# [Component / Hook / API / Behavior name]

[One-sentence technical description]

## Overview

Short technical description (2–3 sentences).

## [Schema / Interface / Props]

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `field_name` | `string` | Yes | [Description] |

## Usage

\`\`\`python
# Real example from the codebase
\`\`\`

## Notes

- Important implementation details
- Non-obvious behavior
- Things that cannot be inferred from the code (remove if not needed)

## See also

- Related modules or docs
```

---

### Template B — Reference, user (admin/editor)

```md
---
myst:
  html_meta:
    description: "[Short description for search, max 160 chars]"
    keywords: "[comma, separated, keywords]"
doc_type: reference
audience: [admin|editor]
---

# [Feature / Setting name]

[One-sentence description of what this is and when you'd use it]

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Setting name** | What it controls | `value` |

## [Section for each major area]

[Description with screenshot path if helpful]

## See also

- [Link to how-to that uses this]
- [Link to concept that explains why]
```

---

### Template C — How-to, developer

```md
---
myst:
  html_meta:
    description: "[Short description for search, max 160 chars]"
    keywords: "[comma, separated, keywords]"
doc_type: how-to
audience: developer
---

# [Present-tense verb + object, sentence case]

## Goal

What this achieves (1–2 sentences).

## Prerequisites

- List anything the reader needs before starting.

## Steps

1. First step — include real code examples where relevant.
2. Second step.
3. ...

## Verification

How to confirm the steps worked.

## Notes

Edge cases, caveats, or things that cannot be inferred from the code (remove if not needed).

## See also

- Related docs or reference pages.
```

---

### Template D — How-to, user (admin/editor)

```md
---
myst:
  html_meta:
    description: "[Short description for search, max 160 chars]"
    keywords: "[comma, separated, keywords]"
doc_type: how-to
audience: [admin|editor]
tags: [tag1, tag2]
---

# [Present-tense verb + object, sentence case]

This guide shows you how to [specific goal].

## Prerequisites

- [Requirement 1]

## Steps

### 1. [Action]

[Instruction with screenshot path if needed]

### 2. [Action]

[Instruction]

## Verification

To confirm [action] worked:

1. [Verification step]
2. [Expected result]

## Notes

Edge cases or caveats (remove if not needed).

## See also

- [Link to related how-to]
- [Link to reference]
```

---

### Template E — Explanation / concepts

```md
---
myst:
  html_meta:
    description: "[Short description for search, max 160 chars]"
    keywords: "[comma, separated, keywords]"
doc_type: explanation
audience: [admin|editor|developer]
---

# [Concept name, sentence case]

[Opening paragraph: why this concept matters to the reader]

## How [concept] works

Explanation of internal logic and flow.

## Key principles

### [Principle 1]

[Explanation]

### [Principle 2]

[Explanation]

## [Concept] in practice

Real-world examples showing how this concept manifests in the system.

## Notes

Design choices, tradeoffs, or things that cannot be inferred from the code (remove if not needed).

## See also

- Related docs
```

---

### Template F — Tutorial

```md
---
myst:
  html_meta:
    description: "[Short description for search, max 160 chars]"
    keywords: "[comma, separated, keywords]"
doc_type: tutorial
audience: [editor|admin|developer]
difficulty: beginner
estimated_time: "[X] minutes"
---

# [Present-tense verb describing what the learner builds, sentence case]

In this tutorial, you will learn to [specific outcome]. By the end, you will have [concrete deliverable].

## Prerequisites

- [Requirement 1]
- [Requirement 2]

## Step 1: [Action]

[Explanation of what we're doing and why]

1. [Specific instruction]
2. [Specific instruction]

You should now see [expected result].

## Step 2: [Action]

[Continue pattern…]

## What you've learned

You have successfully:

- [Skill 1]
- [Skill 2]

## Next steps

- [Link to related tutorial or how-to]
```

---

## STEP 5 — Output rules

- Use clean Markdown only
- Be concise and structured
- Prefer tables over paragraphs for API/props/settings
- No unnecessary filler or explanation
- No duplication across documents — use cross-references instead
- Remove any template section that does not apply (e.g. empty "See also")
- Store screenshots in `docs/_static/images/` and reference them with a relative path
- Output one document at a time, clearly separated with the target file path

---

## STEP 6 — Execution order

1. List all modules found and their classification (`doc_type`, `audience`, `location`)
2. Confirm the list before writing — ask the user if unsure about classification
3. Write one document at a time
4. After each document, state the suggested file path

---

## Strict constraints

- NEVER mix doc types in one document
- NEVER invent or assume functionality not found in the code
- ALWAYS follow the correct template structure
- ALWAYS include `## Notes` when something cannot be inferred from the code
- DEFAULT to `reference` when unsure of doc type
- DEFAULT to `developer` audience when the feature requires writing code
- NEVER duplicate content — cross-reference instead
