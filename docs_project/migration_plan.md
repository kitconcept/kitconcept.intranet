# Documentation Migration Plan
### kitconcept.intranet — Consolidating docs(intranet) + docs(core) + docs(vlt)

---

## SECTION 1 — File Disposition Table

> **Key:** Source paths are relative to their repo root. Target paths are relative to the unified `new_docs/` root (the output folder for all migrated content).

| # | Source File | Source Repo | Action | Target Path | Doc Type | Audience | Notes |
|---|------------|------------|--------|-------------|----------|----------|-------|
| 1 | `how-to-guides/passive-targeting.md` | intranet | MOVE | `how-to-guides/engagement/passive-targeting.md` | how-to | editor | Frontmatter update only; rename `og:` tags |
| 2 | `how-to-guides/person-responsibilities.md` | intranet | REWRITE | `reference/content-types.md` (as a section) | reference | editor | Becomes a subsection under "Person" in the unified content types reference; too thin to stand alone as a how-to |
| 3 | `how-to-guides/squared-person-image-support.md` | intranet | MOVE | `how-to-guides/settings/person-image-style.md` | how-to | admin | Rename file; update 2 image paths (`/_static/rounded-person.jpg`, `/_static/squared-person.jpg`) |
| 4a | `how-to-guides/content-interactions.md` | intranet | SPLIT→A | `how-to-guides/engagement/enable-likes.md` | how-to | admin | Extract: "Configuration" section only + user-facing bullets from "Overview" |
| 4b | `how-to-guides/content-interactions.md` | intranet | SPLIT→B | `developer/reference/components/content-interactions.md` | reference | developer | Extract: "Overview" (JSX component description), "Component Location" |
| 5a | `how-to-guides/content-feedback-form.md` | intranet | SPLIT→A | `how-to-guides/feedback/configure-feedback.md` | how-to | admin | Extract: "Overview" (user-facing), all screenshots, "Intranet Settings" table |
| 5b | `how-to-guides/content-feedback-form.md` | intranet | SPLIT→B | `developer/reference/behaviors/clm.md` | reference | developer | Extract: "Behavior: ICLM" field table, "Widget Configuration" section |
| 6 | `glossary.md` + `glossary.md` | intranet + core | MERGE | `glossary.md` | — | all | Both are identical scaffolded placeholders (same 5 generic terms). Merge into one, then REWRITE with real intranet terms (CLM, passive targeting, person, organisational unit, etc.) |
| 7 | `concepts/what-is-core.md` | core | REWRITE | `developer/concepts/architecture.md` | explanation | developer | Retitle to "System Architecture". Content is accurate but needs restructuring to Diataxis explanation template. **Domain expert review required** before publication |
| 8a | `how-to-guides/blocks-config-ttw.md` | core | SPLIT→A | `how-to-guides/settings/blocks-config.md` | how-to | admin | Extract: "Enabling the behavior" + "Accessing the configuration field" sections + simplified JSON examples |
| 8b | `how-to-guides/blocks-config-ttw.md` | core | SPLIT→B | `developer/how-to-guides/blocks-config-ttw.md` | how-to | developer | Extract: "The mutator field DSL" section with TypeScript type + all JSON examples |
| 9 | `how-to-guides/reindex-content-script.md` | core | MOVE | `developer/how-to-guides/reindex-content.md` | how-to | developer | Frontmatter update; content is clean and complete |
| 10 | `how-to-guides/move-rename-content-objects.md` | core | MOVE | `developer/how-to-guides/move-rename-content.md` | how-to | developer | Frontmatter update |
| 11 | `how-to-guides/upgrade-dependencies.md` | core | MOVE | `developer/how-to-guides/upgrade-dependencies.md` | how-to | developer | Frontmatter update; verify `uvx` reference is still accurate |
| 12 | `how-to-guides/upgrade-plone.md` | core | MOVE | `developer/how-to-guides/upgrade-plone.md` | how-to | developer | Frontmatter update; XML upgrade step examples may become stale |
| 13 | `how-to-guides/ensure-versions-distribution-projects.md` | core | MOVE | `developer/how-to-guides/ensure-versions-distribution-projects.md` | how-to | developer | Long setup doc; **domain expert review** on script paths |
| 14 | `how-to-guides/upgrade-distribution-make-upgrade.md` | core | MOVE | `developer/how-to-guides/upgrade-distribution.md` | how-to | developer | Update internal cross-reference link to `ensure-versions-distribution-projects` after move |
| 15 | `how-to-guides/import-export.md` | core | MOVE | `how-to-guides/settings/import-export.md` | how-to | admin | Clean doc; image paths in `../_static/` must be updated to `/_static/` |
| 16 | `reference/frontend-styleguide.md` | core | MOVE | `developer/reference/frontend-styleguide.md` | reference | developer | Large comprehensive doc; `../_static/` image paths need update. **Domain expert review** for currency |
| 17 | `conceptual-guides/block-model-v3.md` | vlt | MOVE | `developer/concepts/block-model.md` | explanation | developer | Rename file (drop `-v3`); frontmatter update |
| 18 | `conceptual-guides/layout.md` | vlt | MOVE | `developer/concepts/layout.md` | explanation | developer | Frontmatter update |
| 19 | `conceptual-guides/requirements-and-specifications.md` | vlt | SKIP | — | — | — | VLT-internal design decisions (avoid Semantic UI, Plone 7 planning). Not relevant to intranet distribution users or developers |
| 20a | `conceptual-guides/site-customization.md` | vlt | SPLIT→A | `reference/site-customization.md` | reference | admin | Extract: "Header", "Theming", "Footer" sections describing UI-configurable fields |
| 20b | `conceptual-guides/site-customization.md` | vlt | SPLIT→B | `developer/reference/behaviors/voltolighttheme.md` | reference | developer | Extract: "Plone site root" + "Subsites" inheritance model + "Add behaviors" XML code blocks |
| 21 | `conceptual-guides/vertical-spacing.md` | vlt | MOVE | `developer/concepts/vertical-spacing.md` | explanation | developer | Frontmatter update |
| 22 | `how-to-guides/acceptance-tests.md` | vlt | SKIP | — | — | — | VLT-internal CI test runner guide |
| 23 | `how-to-guides/contributing.md` | vlt | SKIP | — | — | — | VLT-internal contributing guide; intranet has `developer/getting-started/contributing.md` (NEW) |
| 24 | `how-to-guides/develop-add-ons.md` | vlt | SKIP | — | — | — | Describes developing within VLT repo specifically. Not about intranet distribution development |
| 25 | `how-to-guides/install.md` | vlt | SKIP | — | — | — | VLT is already bundled as a dependency of kitconcept.intranet. Recommended add-ons content captured separately in `recommended-addons.md` |
| 26 | `how-to-guides/releases.md` | vlt | SKIP | — | — | — | VLT-internal release process |
| 27 | `how-to-guides/remove-colophon.md` | vlt | MOVE | `developer/how-to-guides/remove-colophon.md` | how-to | developer | Short but complete; frontmatter update |
| 28 | `how-to-guides/social-media.md` | vlt | MOVE | `developer/how-to-guides/configure-social-media.md` | how-to | developer | Requires backend XML editing; developer audience confirmed |
| 29 | `how-to-guides/summary.md` | vlt | MOVE | `developer/reference/components/summary.md` | reference | developer | Misclassified as how-to in source; primarily component API with usage examples |
| 30 | `how-to-guides/upgrade-guide.md` | vlt | MOVE | `developer/how-to-guides/upgrade-vlt.md` | how-to | developer | Version-specific content; **domain expert must verify** current version coverage. Consider pruning very old versions (3.x, 4.x) |
| 31 | `how-to-guides/visual-regression-tests.md` | vlt | SKIP | — | — | — | VLT-internal Playwright visual testing |
| 32 | `reference/card.md` | vlt | MOVE | `developer/reference/components/card.md` | reference | developer | Frontmatter update |
| 33 | `reference/colors.md` | vlt | MOVE | `developer/reference/colors.md` | reference | developer | No matching file in spec; fits at `developer/reference/` root |
| 34 | `reference/compatibility.md` | vlt | MOVE | `developer/reference/compatibility.md` | reference | developer | Must be kept current with new VLT releases |
| 35 | `reference/helpers.md` | vlt | MOVE | `developer/reference/components/helpers.md` | reference | developer | Frontmatter update |
| 36 | `reference/image-aspect-ratio.md` | vlt | MOVE | `developer/reference/image-aspect-ratio.md` | reference | developer | No matching file in spec; fits at `developer/reference/` root |
| 37 | `reference/recommended-addons.md` | vlt | MOVE | `developer/reference/recommended-addons.md` | reference | developer | Must be kept current; may be outdated |
| 38 | `reference/slots.md` | vlt | MOVE | `developer/reference/components/slots.md` | reference | developer | Frontmatter update |
| 39 | `reference/storybook.md` | vlt | MOVE | `developer/reference/storybook.md` | reference | developer | Frontmatter update |
| 40 | `reference/use-live-data.md` | vlt | MOVE | `developer/reference/components/use-live-data.md` | reference | developer | Frontmatter update |
| 41 | `reference/widgets.md` | vlt | MOVE | `developer/reference/components/widgets.md` | reference | developer | Frontmatter update |

### NEW files (required by target structure, no source exists)

| Target Path | Priority | Notes |
|-------------|----------|-------|
| `index.md` | HIGH | Rewrite from intranet `index.md`; add all new toctree sections |
| `reference/control-panel.md` | HIGH | All `IIntranetSettings` options; requires domain expert |
| `reference/content-types.md` | HIGH | Location, Org Unit, Person; absorbs `person-responsibilities.md` content |
| `concepts/content-ownership.md` | HIGH | CLM inheritance; partial content from `content-feedback-form.md` SPLIT |
| `developer/getting-started/installation.md` | HIGH | Dev environment setup |
| `developer/getting-started/project-structure.md` | HIGH | Monorepo layout |
| `developer/reference/api/votes.md` | HIGH | `@votes` endpoint |
| `developer/reference/api/feedback.md` | HIGH | `@feedback` endpoint; partial content from SPLIT of `content-feedback-form.md` |
| `developer/reference/api/byline.md` | MEDIUM | `@byline` endpoint |
| `developer/reference/api/clm.md` | MEDIUM | `@clm` endpoint |
| `developer/reference/behaviors/person.md` | MEDIUM | `IPersonBehavior` schema |
| `developer/reference/behaviors/location.md` | MEDIUM | `ILocationBehavior` schema |
| `developer/reference/behaviors/organisational-unit.md` | MEDIUM | Org unit behavior schema |
| `developer/reference/behaviors/votes.md` | MEDIUM | `IVotes` schema |
| `developer/reference/registry.md` | MEDIUM | Full `IIntranetSettings` schema |
| `developer/reference/components/feedback-form.md` | MEDIUM | `FeedbackForm` component |
| `developer/reference/components/person-view.md` | MEDIUM | `PersonView` component |
| `developer/concepts/data-model.md` | MEDIUM | Content types and relations |
| `developer/concepts/security-model.md` | MEDIUM | Permissions and roles |
| `developer/getting-started/contributing.md` | LOW | Contribution guidelines |
| `tutorials/your-first-page.md` | LOW | — |
| `tutorials/organizing-content.md` | LOW | — |
| `tutorials/using-feedback.md` | LOW | — |
| `how-to-guides/content/create-person.md` | LOW | — |
| `how-to-guides/content/create-location.md` | LOW | — |
| `how-to-guides/content/create-organisational-unit.md` | LOW | — |
| `how-to-guides/content/set-content-owner.md` | LOW | — |
| `how-to-guides/feedback/submit-feedback.md` | LOW | — |
| `how-to-guides/settings/search-settings.md` | LOW | — |
| `how-to-guides/settings/iframe-domains.md` | LOW | — |
| `how-to-guides/authentication/oidc-setup.md` | LOW | — |
| `reference/workflows.md` | LOW | — |
| `concepts/organisational-structure.md` | LOW | — |
| `concepts/personalization.md` | LOW | — |
| `developer/tutorials/custom-behavior.md` | LOW | — |
| `developer/tutorials/custom-block.md` | LOW | — |
| `developer/tutorials/custom-widget.md` | LOW | — |
| `developer/how-to-guides/extend-control-panel.md` | LOW | — |
| `developer/how-to-guides/add-api-endpoint.md` | LOW | — |
| `developer/how-to-guides/customize-email-templates.md` | LOW | — |
| `developer/how-to-guides/add-vocabulary.md` | LOW | — |
| `developer/how-to-guides/override-components.md` | LOW | — |
| `developer/reference/vocabularies.md` | LOW | — |

---

## SECTION 2 — Execution Order

### Phase 1 — Directory Scaffolding

Create the `new_docs/` root folder and all required subdirectories. All migrated and new content lands here. Empty `index.md` stubs are created now and filled in Phase 5.

```bash
TARGET=new_docs
mkdir -p $TARGET

# User-facing subdirectories
mkdir -p $TARGET/how-to-guides/content
mkdir -p $TARGET/how-to-guides/feedback
mkdir -p $TARGET/how-to-guides/engagement
mkdir -p $TARGET/how-to-guides/settings
mkdir -p $TARGET/how-to-guides/authentication
mkdir -p $TARGET/reference
mkdir -p $TARGET/concepts
mkdir -p $TARGET/tutorials

# Developer subdirectories
mkdir -p $TARGET/developer/getting-started
mkdir -p $TARGET/developer/tutorials
mkdir -p $TARGET/developer/how-to-guides
mkdir -p $TARGET/developer/reference/api
mkdir -p $TARGET/developer/reference/behaviors
mkdir -p $TARGET/developer/reference/components
mkdir -p $TARGET/developer/concepts
```

Touch stub `index.md` in every new directory (filled in Phase 5):

```
how-to-guides/content/index.md
how-to-guides/feedback/index.md
how-to-guides/engagement/index.md
how-to-guides/settings/index.md
how-to-guides/authentication/index.md
developer/index.md
developer/getting-started/index.md
developer/tutorials/index.md
developer/how-to-guides/index.md
developer/reference/index.md
developer/reference/api/index.md
developer/reference/behaviors/index.md
developer/reference/components/index.md
developer/concepts/index.md
```

---

### Phase 2 — Direct Moves (frontmatter addition only, no content changes)

For each file: **copy** to target path, update frontmatter (see Section 6), update image paths to `/_static/` in unified root. Do **not** delete source files yet — delete only after Phase 7 validation passes.

| Step | Source | Target | Image Path Update? |
|------|--------|--------|--------------------|
| 2.1 | `intranet/how-to-guides/passive-targeting.md` | `how-to-guides/engagement/passive-targeting.md` | No |
| 2.2 | `intranet/how-to-guides/squared-person-image-support.md` | `how-to-guides/settings/person-image-style.md` | Yes: copy `/_static/rounded-person.jpg`, `/_static/squared-person.jpg` to unified `_static/` |
| 2.3 | `core/how-to-guides/reindex-content-script.md` | `developer/how-to-guides/reindex-content.md` | No |
| 2.4 | `core/how-to-guides/move-rename-content-objects.md` | `developer/how-to-guides/move-rename-content.md` | No |
| 2.5 | `core/how-to-guides/upgrade-dependencies.md` | `developer/how-to-guides/upgrade-dependencies.md` | No |
| 2.6 | `core/how-to-guides/upgrade-plone.md` | `developer/how-to-guides/upgrade-plone.md` | No |
| 2.7 | `core/how-to-guides/ensure-versions-distribution-projects.md` | `developer/how-to-guides/ensure-versions-distribution-projects.md` | No |
| 2.8 | `core/how-to-guides/upgrade-distribution-make-upgrade.md` | `developer/how-to-guides/upgrade-distribution.md` | No — update cross-reference: `[](/how-to-guides/ensure-versions-distribution-projects)` → `[](/developer/how-to-guides/ensure-versions-distribution-projects)` |
| 2.9 | `core/how-to-guides/import-export.md` | `how-to-guides/settings/import-export.md` | Yes: `../_static/importExport.png`, `../_static/export.png`, etc. → copy all to unified `_static/` |
| 2.10 | `core/reference/frontend-styleguide.md` | `developer/reference/frontend-styleguide.md` | Yes: `../_static/blockWidth.png` etc. → copy to unified `_static/` |
| 2.11 | `vlt/conceptual-guides/block-model-v3.md` | `developer/concepts/block-model.md` | No |
| 2.12 | `vlt/conceptual-guides/layout.md` | `developer/concepts/layout.md` | No |
| 2.13 | `vlt/conceptual-guides/vertical-spacing.md` | `developer/concepts/vertical-spacing.md` | No |
| 2.14 | `vlt/how-to-guides/remove-colophon.md` | `developer/how-to-guides/remove-colophon.md` | No |
| 2.15 | `vlt/how-to-guides/social-media.md` | `developer/how-to-guides/configure-social-media.md` | No — also fix malformed frontmatter on line 6 (extra trailing `"`) |
| 2.16 | `vlt/how-to-guides/summary.md` | `developer/reference/components/summary.md` | Yes: `/_static/summary.png` → copy to unified `_static/` |
| 2.17 | `vlt/how-to-guides/upgrade-guide.md` | `developer/how-to-guides/upgrade-vlt.md` | Yes: `/_static/footer6.png` → copy |
| 2.18 | `vlt/reference/card.md` | `developer/reference/components/card.md` | No |
| 2.19 | `vlt/reference/colors.md` | `developer/reference/colors.md` | No |
| 2.20 | `vlt/reference/compatibility.md` | `developer/reference/compatibility.md` | No |
| 2.21 | `vlt/reference/helpers.md` | `developer/reference/components/helpers.md` | No |
| 2.22 | `vlt/reference/image-aspect-ratio.md` | `developer/reference/image-aspect-ratio.md` | No |
| 2.23 | `vlt/reference/recommended-addons.md` | `developer/reference/recommended-addons.md` | No |
| 2.24 | `vlt/reference/slots.md` | `developer/reference/components/slots.md` | No |
| 2.25 | `vlt/reference/storybook.md` | `developer/reference/storybook.md` | No |
| 2.26 | `vlt/reference/use-live-data.md` | `developer/reference/components/use-live-data.md` | No |
| 2.27 | `vlt/reference/widgets.md` | `developer/reference/components/widgets.md` | No |

**Image consolidation step (run once during Phase 2):** Copy all `_static/` assets from each source repo into the unified `docs/_static/`. Check for filename collisions first:

```bash
# Check for conflicts before copying
ls intranet/_static/ core/_static/ vlt/_static/ | sort | uniq -d
```

Known collision risk: generic filenames like `logo.png`, `favicon.ico`. Prefix with source repo name if conflict found (e.g., `vlt-logo.png`) and update all references in the same commit.

---

### Phase 3 — Content Splits

Execute each split as a separate atomic task: create both output files simultaneously.

- **Split 3.1** — `intranet/content-interactions.md` → `how-to-guides/engagement/enable-likes.md` + `developer/reference/components/content-interactions.md`
- **Split 3.2** — `intranet/content-feedback-form.md` → `how-to-guides/feedback/configure-feedback.md` + `developer/reference/behaviors/clm.md`
- **Split 3.3** — `core/blocks-config-ttw.md` → `how-to-guides/settings/blocks-config.md` + `developer/how-to-guides/blocks-config-ttw.md`
- **Split 3.4** — `vlt/conceptual-guides/site-customization.md` → `reference/site-customization.md` + `developer/reference/behaviors/voltolighttheme.md`

See Section 3 for exact content mapping per split.

---

### Phase 4 — Content Rewrites

- **Rewrite 4.1** — `intranet/person-responsibilities.md` → section under "Person" H2 in `reference/content-types.md` (new file)
- **Rewrite 4.2** — `core/concepts/what-is-core.md` → `developer/concepts/architecture.md` (retitle, restructure to Diataxis explanation template)
- **Rewrite 4.3** — Glossary merge + intranet term additions → `glossary.md`

---

### Phase 5 — Merge Operations

- **Merge 5.1** — Glossary (see Section 4)
- **Merge 5.2** — Index pages (see Section 5): update root `index.md`, fill all directory `index.md` stubs with correct toctrees

---

### Phase 6 — New Content Stubs

Create stub files in priority order. Each stub = frontmatter + H1 + `:::{note} This page is a stub. :::` directive.

**6.1 High priority** (needed for cross-linking):

1. `reference/control-panel.md`
2. `reference/content-types.md` (incorporates person-responsibilities rewrite)
3. `concepts/content-ownership.md`
4. `developer/getting-started/installation.md`
5. `developer/getting-started/project-structure.md`
6. `developer/reference/api/votes.md`
7. `developer/reference/api/feedback.md`
8. `developer/reference/behaviors/person.md`
9. `developer/reference/behaviors/location.md`
10. `developer/reference/behaviors/organisational-unit.md`
11. `developer/reference/behaviors/votes.md`
12. `developer/reference/registry.md`

**6.2 Medium priority:**

13. `developer/reference/api/byline.md`
14. `developer/reference/api/clm.md`
15. `developer/reference/components/feedback-form.md`
16. `developer/reference/components/person-view.md`
17. `developer/concepts/data-model.md`
18. `developer/concepts/security-model.md`

**6.3 Lower priority:** Create minimal stubs for all remaining NEW files. Do not add them to published toctrees until content is written — use `exclude_patterns` in `conf.py` to hide draft stubs from the build.

---

### Phase 7 — Validation

Execute in order. Do not skip steps.

```bash
# 7.1 Frontmatter lint — every .md must have required frontmatter
python scripts/check_frontmatter.py new_docs/

# 7.2 Internal link check
sphinx-build -b linkcheck new_docs new_docs/_build/linkcheck

# 7.3 Full Sphinx build — must complete without warnings
sphinx-build -b html new_docs new_docs/_build/html

# 7.4 Check every .md is included in at least one toctree
# Sphinx will warn: "document isn't included in any toctree"

# 7.5 Check all index.md files have toctree directives
grep -rL "toctree" new_docs/*/index.md new_docs/*/*/index.md

# 7.6 Check image references resolve after _static/ consolidation
grep -r '\.\./\_static' new_docs/  # should return nothing
```

---

## SECTION 3 — Content Split Instructions

### Split 3.1 — `content-interactions.md` → 2 files

**File A: `how-to-guides/engagement/enable-likes.md`**

```yaml
---
myst:
  html_meta:
    description: "Enable content likes and ratings for pages in your kitconcept intranet."
    keywords: "likes, ratings, content interactions, engagement, admin"
doc_type: how-to
audience: admin
tags: [engagement, likes, ratings]
---
```

Content map from source:

- **Include:** From "Overview" — the 4 bullet points describing each feature (Likes, Comments, Share, Metadata), keeping user-facing language. **Remove** the `ContentInteractions.jsx` filename reference.
- **Include:** All of "Configuration" section verbatim (both screenshots: `globally-rating.png`, `content-rating.png`)
- **Include:** The `enable_content_rating` setting name and `enable_likes` field reference (admin needs to know what to look for)
- **Exclude:** "Component Location" (`src/components/ContentInteractions/ContentInteractions.jsx`) — goes to File B
- **Add:** H2 "Prerequisites" at top: "The `kitconcept.intranet.votes` behavior must be enabled for the content type (contact your developer if unsure)"
- **Add:** H2 "See Also" linking to `developer/reference/components/content-interactions.md`

**File B: `developer/reference/components/content-interactions.md`**

```yaml
---
myst:
  html_meta:
    description: "Reference for the ContentInteractions React component — votes, comments, share, and metadata."
    keywords: "ContentInteractions, JSX, votes, component, developer"
doc_type: reference
audience: developer
---
```

Content map from source:

- **Include:** Screenshot at top (visual overview)
- **Include:** Full "Overview" section verbatim (all 4 bullets with technical details: behavior names, field names, conditions)
- **Include:** "Component Location" section verbatim
- **Add:** H2 "See Also" linking to `how-to-guides/engagement/enable-likes.md`, `developer/reference/behaviors/votes.md`, `developer/reference/api/votes.md`

---

### Split 3.2 — `content-feedback-form.md` → 2 files

**File A: `how-to-guides/feedback/configure-feedback.md`**

```yaml
---
myst:
  html_meta:
    description: "Configure feedback recipients and email settings for content pages in your intranet."
    keywords: "feedback, configure, email, CLM, admin"
doc_type: how-to
audience: admin
tags: [feedback, email, configuration]
---
```

Content map from source:

- **Include:** All of "Overview" section verbatim (recipient priority list, sticky button description)
- **Include:** All screenshots: `sticky-feedback-button.png`, `content-feedback-form.png`, `clm.png`, `email.png`, `intranet.png`
- **Include:** "Intranet Settings" table (the 4 settings: `default_feedback_email`, `feedback_cc_email`, `allowed_email_domains`, `enable_sticky_feedback_button`)
- **Exclude:** "Behavior: `ICLM`" field table → File B
- **Exclude:** "Widget Configuration" section → File B
- **Add:** H2 "Prerequisites": "Ensure the CLM behavior is applied to your content types (contact your developer)"
- **Add:** Note: "The Authors, Content Owner, and Feedback to fields are added via the CLM behavior. See the [CLM behavior reference](/developer/reference/behaviors/clm) for technical details."
- **Add:** H2 "See Also" linking to `developer/reference/behaviors/clm.md`, `developer/reference/api/feedback.md`

**File B: `developer/reference/behaviors/clm.md`**

```yaml
---
myst:
  html_meta:
    description: "ICLM behavior schema — fields, widget configuration, and vocabulary references."
    keywords: "CLM, ICLM, behavior, responsible_person, feedback_person, authors, developer"
doc_type: reference
audience: developer
---
```

Content map from source:

- **Include:** "Behavior: `ICLM`" H2 + field table verbatim (authors, responsible_person, feedback_person — types, descriptions, permissions, notes)
- **Include:** "Widget Configuration" section verbatim
- **Add:** H2 "Overview" at top: "The `ICLM` behavior provides content lifecycle management fields. When applied to a content type, it exposes Authors, Content Owner, and Feedback To fields used by the feedback routing system."
- **Add:** H2 "See Also" linking to `how-to-guides/feedback/configure-feedback.md`, `developer/reference/api/feedback.md`

---

### Split 3.3 — `blocks-config-ttw.md` → 2 files

**File A: `how-to-guides/settings/blocks-config.md`**

```yaml
---
myst:
  html_meta:
    description: "Configure which blocks are available for editors using the Blocks Configuration field in Site Setup."
    keywords: "blocks, configuration, TTW, through the web, site settings, admin"
doc_type: how-to
audience: admin
tags: [blocks, configuration, site-settings]
---
```

Content map from source:

- **Include:** "Enabling the behavior" section verbatim (1 sentence)
- **Include:** "Accessing the configuration field" section (2 sentences + both screenshots: `ttwblocksconfig.png`, `ttwconfigjsonfieldmodal.png`)
- **Include:** From "The mutator field DSL" — the 3-bullet list of what can be configured + the JSON example block only
- **Exclude:** The TypeScript `MutatorDSL` type definition → File B
- **Add:** Note: "The JSON format must use double quotes and no trailing commas. For the full DSL specification, see [Blocks Configuration TTW developer reference](/developer/how-to-guides/blocks-config-ttw)."

**File B: `developer/how-to-guides/blocks-config-ttw.md`**

```yaml
---
myst:
  html_meta:
    description: "Full DSL reference for configuring Volto blocks through the web using the kitconcept.blocks.config behavior."
    keywords: "blocks, configuration, TTW, mutator DSL, kitconcept.blocks.config, developer"
doc_type: how-to
audience: developer
---
```

Content map from source:

- **Include:** Opening paragraph (description of feature and behavior)
- **Include:** What can be configured (3-bullet list)
- **Include:** Full "The mutator field DSL" section including the TypeScript `MutatorDSL` type
- **Include:** Complete JSON example with explanation of each key
- **Add:** H2 "See Also" linking to `how-to-guides/settings/blocks-config.md` (admin guide)

---

### Split 3.4 — `vlt/site-customization.md` → 2 files

**File A: `reference/site-customization.md`**

```yaml
---
myst:
  html_meta:
    description: "Site customization options available through VLT behaviors — header, theme, and footer settings."
    keywords: "site customization, logo, colors, footer, header, admin"
doc_type: reference
audience: admin
---
```

Content map from source:

- **Include:** "Header" section (logo, complementary logo, fat menu, intranet header, intranet flag, actions)
- **Include:** "Theming" section (navigation text color, fat menu colors, footer colors)
- **Include:** "Footer" section (footer links, footer logos, footer colophon text)
- **Exclude:** "Plone site root", "Subsites", "Add behaviors" → File B
- **Add:** Note at top: "These settings are available once your site has VLT behaviors applied. For setup, see [Configure VLT Behaviors](/developer/reference/behaviors/voltolighttheme)."

**File B: `developer/reference/behaviors/voltolighttheme.md`**

```yaml
---
myst:
  html_meta:
    description: "Technical reference for kitconcept.voltolighttheme behaviors — applying and inheriting site customization."
    keywords: "voltolighttheme, behaviors, header, theme, footer, site, subsite, XML, developer"
doc_type: reference
audience: developer
---
```

Content map from source:

- **Include:** "Plone site root" section verbatim
- **Include:** "Subsites" section verbatim (inheritance model + directory tree example)
- **Include:** "Add behaviors" section verbatim (both XML snippets)
- **Add:** "Behavior Names" table at top:

| Behavior | Purpose |
|----------|---------|
| `voltolighttheme.header` | Logo, nav, intranet flag, header actions |
| `voltolighttheme.theme` | Colors, font, background |
| `voltolighttheme.footer` | Footer links, logos, colophon |

- **Add:** Reassign anchor labels from source: `(site-customization)=` stays in File A; `(site-customization-actions)=` stays in File A; `(plonegovbr-volto-social-media-label)=` moves to `developer/how-to-guides/configure-social-media.md`
- **Add:** H2 "See Also" linking to `reference/site-customization.md`

> **Action required:** `upgrade-guide.md` references `` {ref}`site-customization` `` — update this cross-reference to `/reference/site-customization` after the split.

---

## SECTION 4 — Glossary Merge Strategy

### Current State

Both `intranet/glossary.md` and `core/glossary.md` are **identical** scaffolded placeholders containing the same 5 generic terms: `Plone`, `add-on`, `Plone Sphinx Theme`, `MyST`, `Sphinx`. VLT has no glossary file.

### Merge Procedure

1. **Take `intranet/glossary.md` as the base** (repo of record for the unified docs).
2. **Verify they are identical:**
   ```bash
   diff docs\(core\)/glossary.md new_docs/glossary.md
   ```
   If any divergence exists: `intranet` definition wins for intranet-specific terms; `core` definition wins for infrastructure/setup terms.
3. **Remove** the scaffold `{note}` block ("This is an example glossary...").
4. **Rewrite the intro paragraph** to: "Terms and definitions used throughout the kitconcept Intranet Distribution documentation."
5. **Add intranet-specific terms** (definitions require domain expert input):

| Term | Definition scope |
|------|-----------------|
| CLM | Content Lifecycle Management — the ICLM behavior providing Authors, Content Owner, Feedback To fields |
| Passive Targeting | User-relevance sorting in listing/search blocks based on organisational unit or location |
| Person | Intranet content type for staff profiles |
| Organisational Unit | Content type representing a team or department |
| Location | Content type representing a physical location |
| Subsite | Plone content implementing `INavigationRoot`; inherits VLT customization settings |
| Volto Light Theme (VLT) | The frontend theme package (`@kitconcept/volto-light-theme`) used by the distribution |
| kitconcept.core | Backend/frontend baseline layer beneath the intranet distribution |
| Content Owner | The `responsible_person` field from the CLM behavior; identifies the accountable owner of a content item |
| Distribution | A pre-configured Plone setup bundling add-ons, configuration, and content types |

6. **Output location:** `docs/glossary.md` (root, referenced as an appendix in `index.md` toctree)
7. **Status:** Set `status: draft` in frontmatter. Do not publish until intranet-specific terms have been reviewed and defined by a domain expert.
8. **On conflict:** If a term exists in multiple sources with different definitions, document the decision with an inline `<!-- decision: ... -->` comment in the source.

---

## SECTION 5 — Index Page Map

### `index.md` (root)

**Base:** Reuse `intranet/index.md`. Replace welcome paragraph and toctree.

**Toctree:**
```rst
{toctree} How-to Guides
how-to-guides/index

{toctree} Reference
reference/index

{toctree} Tutorials
tutorials/index

{toctree} Concepts
concepts/index

{toctree} Developer Documentation
developer/index

{toctree} Appendices
glossary
genindex
```

**Intro paragraph:** "Welcome to the kitconcept Intranet Distribution documentation. This site covers usage for admins and editors, and technical reference for developers. Built on Plone 6, kitconcept.core, and Volto Light Theme."

---

### `how-to-guides/index.md`

**Base:** `intranet/how-to-guides/index.md`
**Toctree:** `content/index`, `feedback/index`, `engagement/index`, `settings/index`, `authentication/index`

---

### `how-to-guides/content/index.md`

**Base:** NEW
**Toctree:** `create-person`, `create-location`, `create-organisational-unit`, `set-content-owner`
**Intro:** "Guides for creating and managing intranet content types."

---

### `how-to-guides/feedback/index.md`

**Base:** NEW
**Toctree:** `configure-feedback`, `submit-feedback`
**Intro:** "Guides for the content feedback form system."

---

### `how-to-guides/engagement/index.md`

**Base:** NEW
**Toctree:** `enable-likes`, `passive-targeting`
**Intro:** "Guides for content engagement features including likes, ratings, and personalized content sorting."

---

### `how-to-guides/settings/index.md`

**Base:** NEW
**Toctree:** `person-image-style`, `blocks-config`, `import-export`, `search-settings`, `iframe-domains`
**Note:** `site-customization.md` is a reference document — it lives in `reference/`, not here.

---

### `how-to-guides/authentication/index.md`

**Base:** NEW
**Toctree:** `oidc-setup`

---

### `reference/index.md`

**Base:** Rewrite `intranet/reference/index.md` (currently a skeleton)
**Toctree:** `control-panel`, `content-types`, `workflows`, `site-customization`
**Intro:** "Reference documentation for intranet settings, content types, and workflows."

---

### `concepts/index.md`

**Base:** Rewrite `intranet/concepts/index.md` (currently a skeleton)
**Toctree:** `content-ownership`, `organisational-structure`, `personalization`
**Intro:** "Background reading for understanding how the intranet works."

---

### `tutorials/index.md`

**Base:** Rewrite `intranet/tutorials/index.md` (skeleton)
**Toctree:** `your-first-page`, `organizing-content`, `using-feedback`

---

### `developer/index.md`

**Base:** NEW (no source exists)
**Toctree:** `getting-started/index`, `tutorials/index`, `how-to-guides/index`, `reference/index`, `concepts/index`
**Intro:** "Developer documentation for extending, customizing, and integrating the kitconcept Intranet Distribution."

---

### `developer/getting-started/index.md`

**Toctree:** `installation`, `project-structure`, `contributing`

---

### `developer/how-to-guides/index.md`

**Toctree:**
```
blocks-config-ttw
reindex-content
move-rename-content
upgrade-dependencies
upgrade-plone
ensure-versions-distribution-projects
upgrade-distribution
remove-colophon
configure-social-media
upgrade-vlt
extend-control-panel
add-api-endpoint
customize-email-templates
add-vocabulary
override-components
```

---

### `developer/reference/index.md`

**Toctree:**
```
api/index
behaviors/index
components/index
frontend-styleguide
registry
vocabularies
colors
compatibility
image-aspect-ratio
recommended-addons
storybook
```

---

### `developer/reference/api/index.md`

**Toctree:** `votes`, `feedback`, `byline`, `clm`

---

### `developer/reference/behaviors/index.md`

**Toctree:** `person`, `location`, `organisational-unit`, `votes`, `clm`, `voltolighttheme`

---

### `developer/reference/components/index.md`

**Toctree:** `content-interactions`, `feedback-form`, `person-view`, `summary`, `card`, `slots`, `helpers`, `use-live-data`, `widgets`

---

### `developer/concepts/index.md`

**Base:** Reuse `core/concepts/index.md` structure
**Toctree:** `architecture`, `data-model`, `security-model`, `block-model`, `layout`, `vertical-spacing`

---

## SECTION 6 — Frontmatter Checklist

### Required fields on every file (per `documentation_instructions.md` Section 3.1)

```yaml
myst:
  html_meta:
    description: "<max 160 chars>"
    keywords: "<comma separated>"
```

### Recommended fields by document type

**How-to (user):**
```yaml
doc_type: how-to
audience: admin  # or editor
tags: [tag1, tag2]
```

**How-to (developer):**
```yaml
doc_type: how-to
audience: developer
```

**Reference (user):**
```yaml
doc_type: reference
audience: admin  # or editor
```

**Reference (developer):**
```yaml
doc_type: reference
audience: developer
```

**Explanation/Concept:**
```yaml
doc_type: explanation
audience: developer  # or admin/editor
related:
  - /path/to/reference
```

---

### Audience Ambiguity Flags

| File | Ambiguity | Decision |
|------|-----------|----------|
| `how-to-guides/engagement/enable-likes.md` | Likes can be enabled by admin (global setting) or editor (per-item field) | `audience: admin` — the global `enable_content_rating` setting is the prerequisite and is admin-only |
| `how-to-guides/settings/blocks-config.md` | Configuring blocks JSON could be admin or a technical editor | `audience: admin` — requires Site Setup access, which is admin-only |
| `developer/how-to-guides/configure-social-media.md` | Could be seen as a site setup task | `audience: developer` — requires editing `Plone_Site.xml` in a backend add-on |
| `reference/site-customization.md` | UI fields are admin-accessible, but initial behavior setup requires developer | `audience: admin` with note: "Requires VLT behaviors applied by a developer first" |
| `developer/reference/behaviors/voltolighttheme.md` | Field descriptions could be useful to admins too | `audience: developer` — XML configuration is code-level; admin-facing fields live in `reference/site-customization.md` |
| `developer/how-to-guides/reindex-content.md` | Script can be run by DevOps/sysadmin, not just developers | `audience: developer` — requires Docker/zope console access |
| `developer/how-to-guides/upgrade-vlt.md` | Breaking changes list could be useful reading for admins | `audience: developer` — all actions require code changes |

---

### Files where `doc_type` is misclassified in source and must be corrected

| Source File | Source Classification | Correct `doc_type` | Reason |
|-------------|----------------------|-------------------|--------|
| `vlt/how-to-guides/summary.md` | how-to (by location) | `reference` | Documents component API and built-in implementations; task framing is secondary |
| `vlt/conceptual-guides/site-customization.md` | explanation (by location) | `reference` (both outputs) | Both split outputs are descriptive, not task-oriented |
| `intranet/how-to-guides/person-responsibilities.md` | how-to (by location) | `reference` (as section of `content-types.md`) | Describes what the field is, not how to accomplish a task |

---

## SECTION 7 — Risk Register

| # | Risk | Affected Files | Severity | Mitigation |
|---|------|---------------|----------|------------|
| R1 | **Broken internal cross-links after moves.** Source files use relative links that will break after consolidation. | All MOVE and SPLIT files | HIGH | After Phase 2+3, run `sphinx-build -b linkcheck` before Phase 6. Specifically check `upgrade-distribution.md` which has a known link to `ensure-versions-distribution-projects`. |
| R2 | **Image paths diverge.** The `core` docs use `../_static/` relative paths that will break when moved to a different directory depth. | `core/import-export.md`, `core/frontend-styleguide.md`, `core/blocks-config-ttw.md` | HIGH | During Phase 2, normalize all image paths to absolute `/_static/filename.ext`. Audit after move: `grep -r '\.\./\_static' docs/` should return nothing. |
| R3 | **Filename collision in `_static/`.** Three separate `_static/` directories merged into one. Generic filenames may clash. | All image-containing docs | HIGH | Run collision audit in Phase 2 before copying. Prefix colliding filenames with source repo slug (`intranet-`, `core-`, `vlt-`) and update all references in the same commit. |
| R4 | **`what-is-core.md` contains version-specific upgrade step XML** (profile versions like `20251209001`). Will become stale. | `developer/concepts/architecture.md` | MEDIUM | During Rewrite 4.2, wrap the XML upgrade step example in a `{note}` saying "This is an illustrative example. Use current version numbers from the codebase." Do not hardcode version numbers in conceptual docs. **Domain expert review required.** |
| R5 | **`upgrade-vlt.md` version history will drift.** The VLT upgrade guide covers versions 3.x through 8.x. Old sections may confuse users on the current intranet version. | `developer/how-to-guides/upgrade-vlt.md` | MEDIUM | During Phase 2.17, set `status: review` in frontmatter. Assign a domain expert to prune versions that predate the minimum VLT version bundled with the current intranet distribution. |
| R6 | **`frontend-styleguide.md` references `../_static/` images** and external URLs pointing to `6.docs.plone.org` that may restructure. | `developer/reference/frontend-styleguide.md` | LOW | Image path fix covered in Phase 2.10. Add external links to `make linkcheck-external` run in Phase 7. Set `status: review`. |
| R7 | **`recommended-addons.md` is outdated by design.** The source file itself warns the list may be outdated. VLT 8.0.0 changed the `peerDependencies` model. | `developer/reference/recommended-addons.md` | MEDIUM | During Phase 2.23, add `status: review` frontmatter and a `{warning}` at the top pointing to the canonical source (`recommendedAddons.json` in the VLT repository). |
| R8 | **`ensure-versions-distribution-projects.md` references scripts** (`frontend/scripts/upgrade-distribution.js`) that must exist in the target project. Paths may differ. | `developer/how-to-guides/ensure-versions-distribution-projects.md` | MEDIUM | **Domain expert must verify** that script paths and `repository.toml` structure described match the current kitconcept.intranet repo layout before publishing. |
| R9 | **Split content leaves orphaned URLs.** After splitting `content-feedback-form.md`, any external inbound link to the original URL will 404. | `how-to-guides/feedback/configure-feedback.md`, `developer/reference/behaviors/clm.md` | LOW | Check server redirect config. If inbound links exist, add a Sphinx redirect rule or `{deprecated}` notice at the old path. |
| R10 | **VLT `site-customization.md` uses `{ref}` labels** (`(site-customization)=`, `(site-customization-actions)=`, `(plonegovbr-volto-social-media-label)=`). These labels break when content is split. | `reference/site-customization.md`, `developer/reference/behaviors/voltolighttheme.md` | MEDIUM | During Split 3.4, reassign each anchor to the file it lands in. Update `upgrade-guide.md` which cross-references `` {ref}`site-customization` `` — change to `/reference/site-customization`. |
| R11 | **`social-media.md` has malformed frontmatter** on line 6: extra trailing `"` after the `og:title` value. | `developer/how-to-guides/configure-social-media.md` | LOW | Fix during Phase 2.15: change `"property=og:title": "Social media""` to `"property=og:title": "Social media"`. |
| R12 | **Glossary is currently a useless placeholder.** Publishing it with only generic terms (Plone, MyST, Sphinx) adds noise without value. | `glossary.md` | MEDIUM | Set `status: draft` in frontmatter. Gate on domain expert review for actual intranet-specific term definitions before publishing. |
| R13 | **No tutorials exist.** The target structure defines 3 user tutorials and 3 developer tutorials but none have source material. | All `tutorials/` files | LOW | Tutorials are lowest priority. Create stubs with `status: draft`. Exclude from build using `exclude_patterns` in `conf.py` until written. |
| R14 | **`blocks-config-ttw.md` behavior name needs verification.** The doc references `kitconcept.blocks.config` as "enabled by default on the Plone site for the kitconcept intranet distribution." If this changed, the admin doc is wrong. | `how-to-guides/settings/blocks-config.md`, `developer/how-to-guides/blocks-config-ttw.md` | MEDIUM | **Domain expert must confirm** the behavior is still active in the current intranet distribution before the admin-facing how-to is published. |
| R15 | **`developer/concepts/` has stub-only files with no source.** `data-model.md` and `security-model.md` have no source material and require authoring from scratch. | `developer/concepts/data-model.md`, `developer/concepts/security-model.md` | LOW | Stub with `status: draft`. Exclude from published toctree until complete. These are high-value but require domain expert authoring. |

---

## Summary

| Action | Count |
|--------|-------|
| MOVE | 27 |
| SPLIT (source files) | 4 |
| SPLIT (output files) | 8 |
| REWRITE | 3 |
| MERGE | 1 |
| SKIP | 7 |
| NEW (high/medium priority) | 19 |
| NEW (low priority stubs) | ~24 |

**Every source file has been assigned an explicit disposition. No file is left unaccounted for.**

Files marked with **domain expert review required**: `developer/concepts/architecture.md` (what-is-core rewrite), `developer/how-to-guides/ensure-versions-distribution-projects.md` (script paths), `developer/how-to-guides/upgrade-vlt.md` (version currency), `reference/control-panel.md` (new content), `how-to-guides/settings/blocks-config.md` (behavior verification), `glossary.md` (term definitions).
