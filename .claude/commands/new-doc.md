Generate documentation for the following feature or module: $ARGUMENTS

---

## STEP 1 — Analyze the code first (MANDATORY)

Before writing anything:

1. Find all files related to `$ARGUMENTS`:
   - components, hooks, utils, services, types
   - If code is not found in the main repo, check `frontend/packages/` — each subdirectory there is a package that may contain both `backend/` and `frontend/` code
2. Read ALL of them — including every Python source file, not just ZCML or XML.
3. List each module and its responsibility.
4. Do NOT document anything you have not read in the code.
5. Do NOT assume or invent behavior — not field names, not types, not defaults, not registration paths.

### Search the codebase first rule

Before using any syntax, pattern, configuration, or API call — **always search the existing codebase first for a working example**. If a working example exists, copy that pattern exactly. Only if no example exists in the codebase should you search the internet for a solution. Never try to reason from documentation versions, changelogs, or general knowledge when the answer may already be present in the project. This applies to everything: intersphinx syntax, Sphinx directives, TypeScript patterns, Python registrations, slot configurations, test patterns, and anything else.

### Hard stop rule

If you cannot find the source file for something, **stop and tell the user** what you found and what is missing. Do NOT fill gaps with plausible guesses. A missing piece of information must be flagged explicitly, not papered over. Invented content that looks correct is worse than an honest gap.

### Code example rule

Every code example in the documentation — including API calls, function signatures, import paths, and configuration snippets — **must be verified against either an existing usage in the codebase or the actual implementation source**. Do NOT write examples based on analogy, naming patterns, or similarity to other APIs. If you cannot find a real usage or read the implementation, do not write the example — flag the gap instead.

### Backend-first type resolution rule

When documenting props or fields passed from the backend to a frontend component, **always determine the type from the backend source, not from how the frontend code uses the value**. The frontend may expect a shape that the backend does not yet deliver — inferring types from JSX usage (e.g. seeing `ref['@id']` and `ref.title`) documents what the frontend assumes, not what the backend actually sends.

Follow this order for every field:

1. **Find the backend schema** — read the Python behavior or content type (`schema.List`, `schema.Choice`, `schema.TextLine`, etc.) to find the stored type.
2. **Find the serializer** — search `serializers/` for a custom `ISerializeToJson` adapter registered for that content type. If one exists, read it to see how the field is transformed before it reaches the frontend.
3. **If no serializer exists**, the raw stored value is what the frontend receives. Document that type, and flag any mismatch with what the frontend expects.
4. **Never infer a type from JSX alone.** A component reading `ref['@id']` does not prove the backend sends an object — it may be broken.

### TypeScript type resolution rule

When reading a TypeScript file that uses a type imported from another file, **always follow the import and read the type definition in that file before documenting it**. Do not assume what a type looks like from its name alone. If `icon: Image` and `Image` is imported from `@plone/types`, go read `@plone/types` to find the exact shape of `Image` before writing anything about it.

### Trace field usage through all consuming components rule

A TypeScript type declaring a field is not sufficient proof that the field is active and meaningful. **Always trace each field through every component that consumes the type** to verify it is actually read and used. For example, if `iconLink` has `openInNewTab` and `StickyMenu` renders via `IconLinkList`, read `IconLinkList.tsx` to confirm `openInNewTab` is passed through before documenting it. If a field is declared in the type but never read by any component, flag it as unused rather than documenting it as an active field.

The same rule applies to every field declared in the backend — behavior interfaces, content type schemas, or any other Python or XML source. Every field must be traced to confirm it is actually used by the feature being documented.

**Scope this rule strictly to the feature being documented.** When writing docs for feature X, only include fields that are read and used by feature X — by its frontend component, its backend view, or its serialiser. Do not include fields simply because they appear in a shared schema or a type that is also used by other features. If a shared schema has ten fields but the feature only reads three of them, document only those three. The question to ask for every field is: "Is this field used by this specific feature?" — not "Does this field exist somewhere in the codebase?"

### Verify before correcting rule

When the user questions something that was documented, **go back to the source code and re-read it first**. State exactly what the code says and why it matches or does not match what was documented. Do NOT assume the user is right and immediately overwrite correct documentation. If the code confirms the original documentation is correct, say so clearly and confidently, and **show the user the exact code or type definition that proves it** — for example: "I have re-checked the source and what is documented is correct. The `Image` type in `@plone/types` is defined as `{ 'content-type': string; download: string; filename: string; height: number; scales: ...; size: number; width: number }`, which matches what was documented." Only correct documentation when the source code actually contradicts it.

### Customization shadow rule

When documenting a frontend component, **always check whether a customization shadow exists** for it. Search `src/customizations/` for a file at the same relative path as the component. If a shadow exists:

1. Read the shadow file to confirm it re-exports the implementation and to extract the stated `REASON`.
2. Add a **Shadows** line directly below the **File** line in the document:
   ```
   **Shadows:** `<upstream-package>/path/to/Component` via `src/customizations/<upstream-package>/path/to/Component` — <reason from the override header>.
   ```
3. The reason must explain what the customization adds or changes compared to the upstream component — not just that it overrides it.

If no shadow exists, omit the **Shadows** line entirely.

### Interface and class names

Interface and class names must be copied **verbatim from the Python source file** (`class IFoo`). They must never be inferred from the ZCML `name` attribute, the filename, or the behavior title — these are often different. Example: the ZCML name `kitconcept.core.biography` does not tell you the class is `IPersonBiography`; only reading the `.py` file does.

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

### No registration code rule

Do NOT include code blocks showing how a component or utility is registered (e.g. `config.registerComponent`, `config.registerUtility`, `config.addonRoutes`) when that registration pattern is already documented elsewhere. The source code is available in the repo — repeating it in the docs adds noise, not value.

Instead: state the registration file path in one line and link to the relevant docs (VLT, Plone, or internal) that explain the mechanism. Only include a registration code block if the pattern is non-obvious and not documented anywhere else.

### Cross-referencing external documentation

When linking to documentation from an external project (such as Volto Light Theme, Plone, or Python), **always use an intersphinx cross-reference** instead of a plain URL. Intersphinx references are verified at build time and automatically use the correct title from the target docs.

Available intersphinx targets (defined in `docs/docs/conf.py`):

| Key | Documentation site |
|-----|--------------------|
| `vlt` | Volto Light Theme (`https://volto-light-theme.readthedocs.io/`) |
| `plone` | Plone 6 (`https://6.docs.plone.org/`) |
| `python` | Python 3 (`https://docs.python.org/3/`) |

Usage:
```
{doc}`vlt:how-to-guides/summary`
{doc}`plone:volto/configuration/slots`
```

If the target project is not yet in `intersphinx_mapping`, **stop and ask the user to add it** before writing the link. Never use a plain `https://` URL to link to a project that has intersphinx support.

---

## STEP 6 — Execution order

1. List all modules found and their classification (`doc_type`, `audience`, `location`)
2. Confirm the list before writing — ask the user if unsure about classification
3. Write one document at a time
4. After each document, state the suggested file path

---

## Strict constraints

- NEVER mix doc types in one document
- NEVER invent or assume functionality not found in the code — this includes field names, types, defaults, dotted names, registration paths, and component props
- If you cannot find the source, stop and report the gap to the user rather than guessing
- ALWAYS follow the correct template structure
- ALWAYS include `## Notes` when something cannot be inferred from the code
- DEFAULT to `reference` when unsure of doc type
- DEFAULT to `developer` audience when the feature requires writing code
- NEVER duplicate content — cross-reference instead

### Constraints for all docs with audience: admin or editor

- NEVER include code snippets (TypeScript, Python, JSX, or any other language)
- NEVER reference internal component names, hook names, or configuration keys — these are invisible to the reader
- NEVER describe internal behavior (e.g. "the component renders as plain text") — describe only what the user sees in the UI
- EVERY step must correspond to a visible UI action (clicking a button, filling in a field, navigating to a page)
- If a feature has no UI controls (configured only by a developer), add a single `## Notes` line explaining that, do NOT write steps for it, and link to the developer doc instead

### When a feature has both a UI aspect and a developer/code aspect

Split the documentation into two documents:

1. **Admin/editor doc** (`docs/docs/`) — UI steps only, no code. At the top of the `## See also` section, add a link to the developer doc: e.g. `- [Developer: configure X for custom setups](/developer/how-to-guides/configure-x)`
2. **Developer doc** (`docs/docs/developer/`) — code-level configuration, TypeScript/Python snippets, component names, registry keys. At the top of its `## See also` section, link back to the admin/editor doc.

This ensures admins see only what they can do in the UI, while developers can navigate from the admin doc to the deeper technical guide.
