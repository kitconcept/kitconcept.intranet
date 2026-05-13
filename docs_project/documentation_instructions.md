# Documentation Organization Plan (Revised)

> Instructions for organizing documentation for a Plone-based intranet distribution.
> Intended for developers and LLM assistants working on documentation tasks.

---

## 1. Principles

### 1.1 Diataxis Framework

All documentation follows the Diataxis framework, which categorizes content into four types:

| Type | Purpose | User Mode | Example |
|------|---------|-----------|---------|
| **Tutorial** | Learning through doing | Study | "Your first intranet page" |
| **How-to** | Solving a specific problem | Work | "How to configure feedback recipients" |
| **Reference** | Technical description | Work | "Control panel settings" |
| **Concepts** | Understanding concepts | Study | "How content ownership works" |

**Key rules:**
- Never mix types in a single document
- Tutorials guide beginners step-by-step; how-tos assume competence
- Reference describes what exists; explanation describes why it exists
- When unsure, ask: "Is the reader learning or doing? Studying or working?"

### 1.2 Two-Tier Audience Model

Documentation is split into two main areas:

| Area | Location | Audiences | Content Focus |
|------|----------|-----------|---------------|
| **User docs** | Root (`/`) | Admins + Editors | Using and configuring the intranet |
| **Developer docs** | `/developer/` | Developers | Extending, customizing, and integrating |

**Key rules:**
- User docs are the default; developer docs are explicitly separated
- Within user docs, use `audience` frontmatter tags (`admin` or `editor`) for filtering
- Cross-link between areas when relevant, but don't duplicate content
- Write for the least technical person in each area

### 1.3 Single Source of Truth

- Documentation lives in the same repository as code (`/docs` folder)
- No content duplication; use cross-references instead
- Feature documentation ships with the feature code
- Technical details (schemas, component paths) go in `/developer/`; user-facing config stays in root

---

## 2. Folder Structure

```
docs/
├── index.md                      # Landing page with navigation
├── conf.py                       # Sphinx configuration
├── glossary.md                   # Terms and definitions
├── _static/                      # Static assets (images, etc.)
│
├── tutorials/                    # USER TUTORIALS
│   ├── index.md
│   ├── your-first-page.md
│   ├── organizing-content.md
│   └── using-feedback.md
│
├── how-to-guides/                # USER HOW-TOS (admins + editors)
│   ├── index.md
│   ├── content/
│   │   ├── index.md
│   │   ├── create-person.md
│   │   ├── create-location.md
│   │   ├── create-organisational-unit.md
│   │   └── set-content-owner.md
│   ├── feedback/
│   │   ├── index.md
│   │   ├── configure-feedback.md
│   │   └── submit-feedback.md
│   ├── engagement/
│   │   ├── index.md
│   │   ├── enable-likes.md
│   │   └── passive-targeting.md
│   ├── settings/
│   │   ├── index.md
│   │   ├── person-image-style.md
│   │   ├── search-settings.md
│   │   └── iframe-domains.md
│   └── authentication/
│       ├── index.md
│       └── oidc-setup.md
│
├── reference/                    # USER REFERENCE
│   ├── index.md
│   ├── control-panel.md          # All intranet settings explained
│   ├── content-types.md          # Location, Org Unit, Person (user-friendly)
│   └── workflows.md              # Content states and transitions
│
├── concepts/                     # USER CONCEPTS
│   ├── index.md
│   ├── content-ownership.md      # CLM inheritance explained
│   ├── organisational-structure.md
│   └── personalization.md        # Passive targeting concept
│
└── developer/                    # DEVELOPER DOCUMENTATION
    ├── index.md                  # Developer landing page
    │
    ├── getting-started/
    │   ├── index.md
    │   ├── installation.md       # Dev environment setup
    │   ├── project-structure.md  # Monorepo layout
    │   └── contributing.md       # Contribution guidelines
    │
    ├── tutorials/
    │   ├── index.md
    │   ├── custom-behavior.md    # Create a custom behavior
    │   ├── custom-block.md       # Create a Volto block
    │   └── custom-widget.md      # Create a custom widget
    │
    ├── how-to-guides/
    │   ├── index.md
    │   ├── extend-control-panel.md
    │   ├── add-api-endpoint.md
    │   ├── customize-email-templates.md
    │   ├── add-vocabulary.md
    │   └── override-components.md
    │
    ├── reference/
    │   ├── index.md
    │   ├── api/
    │   │   ├── index.md
    │   │   ├── votes.md          # @votes endpoint
    │   │   ├── feedback.md       # @feedback endpoint
    │   │   ├── byline.md         # @byline endpoint
    │   │   └── clm.md            # @clm endpoint
    │   ├── behaviors/
    │   │   ├── index.md
    │   │   ├── person.md         # IPersonBehavior schema
    │   │   ├── location.md       # ILocationBehavior schema
    │   │   ├── organisational-unit.md
    │   │   ├── votes.md          # IVotes schema
    │   │   └── clm.md            # ICLM schema
    │   ├── vocabularies.md       # All vocabulary factories
    │   ├── registry.md           # IIntranetSettings schema
    │   └── components/
    │       ├── index.md
    │       ├── feedback-form.md
    │       ├── content-interactions.md
    │       └── person-view.md
    │
    └── concepts/
        ├── index.md
        ├── architecture.md       # System architecture overview
        ├── data-model.md         # Content types and relations
        └── security-model.md     # Permissions and roles
```

### 2.1 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Folders | lowercase, hyphens | `how-to-guides/` |
| Files | lowercase, hyphens | `configure-feedback.md` |
| Index files | always `index.md` | `how-to-guides/index.md` |
| Tutorials | outcome-focused | `your-first-page.md` |
| How-tos | action-focused | `enable-likes.md` |
| Reference | noun-based | `control-panel.md` |
| Concepts | topic-based | `content-ownership.md` |

### 2.2 When to Create Subdirectories

Create a subdirectory when:
- A topic has 4+ related documents
- Content naturally groups together (e.g., all feedback-related how-tos)
- You need an index page to introduce the subtopic

Keep flat when:
- Fewer than 4 documents on a topic
- Documents are distinct and don't need grouping

### 2.3 Reference Section Guidance

Both root `/reference/` and `/developer/reference/` exist with different purposes:

| Section | Audience | Content Style | Examples |
|---------|----------|---------------|----------|
| `/reference/` | Users | UI-focused, screenshots, plain language | Control panel options, content type fields |
| `/developer/reference/` | Developers | Code-focused, schemas, technical details | API endpoints, behavior interfaces, component props |

**Decision rule:** If someone needs to write code to use the information, it goes in `/developer/reference/`. If they configure it through the UI, it goes in `/reference/`.

---

## 3. Frontmatter Schema

Every document requires YAML frontmatter. MyST Markdown uses `---` delimiters.

### 3.1 Required Fields

```yaml
---
myst:
  html_meta:
    description: "Short description for search results and SEO (max 160 chars)"
    keywords: "comma, separated, keywords"
---
```

### 3.2 Recommended Fields

```yaml
---
myst:
  html_meta:
    description: "..."
    keywords: "..."

# Document metadata (optional but recommended)
doc_type: tutorial | how-to | reference | explanation
audience: admin | editor | developer
last_updated: 2025-01-09
---
```

### 3.3 Optional Fields

```yaml
---
# ... required/recommended fields ...

# Content metadata
tags:
  - feedback
  - configuration
difficulty: beginner | intermediate | advanced
estimated_time: "10 minutes"

# Content lifecycle
status: draft | review | published | deprecated
deprecated_since: "2.0"
superseded_by: /path/to/new/approach

# Related content (renders as "See also")
related:
  - /reference/control-panel
  - /developer/reference/api/feedback
---
```

### 3.4 Frontmatter by Doc Type

**Tutorial (user):**
```yaml
---
myst:
  html_meta:
    description: "Learn to create your first intranet page with images and links."
    keywords: "tutorial, getting started, create page"
doc_type: tutorial
audience: editor
difficulty: beginner
estimated_time: "15 minutes"
---
```

**How-to (user, admin-focused):**
```yaml
---
myst:
  html_meta:
    description: "Configure who receives feedback submissions for your intranet content."
    keywords: "feedback, configuration, email, admin"
doc_type: how-to
audience: admin
tags: [feedback, email]
---
```

**Reference (developer):**
```yaml
---
myst:
  html_meta:
    description: "REST API reference for the @votes endpoint."
    keywords: "API, votes, likes, REST"
doc_type: reference
audience: developer
---
```

---

## 4. Content Templates

### 4.1 Tutorial Template

```markdown
---
myst:
  html_meta:
    description: "[SEO description]"
    keywords: "[keywords]"
doc_type: tutorial
audience: [editor|admin]
difficulty: beginner
estimated_time: "[X] minutes"
---

# [Outcome or Skill]

In this tutorial, you will learn to [specific outcome]. By the end, you will have [concrete deliverable].

## Prerequisites

Before starting, ensure you have:

- [Requirement 1]
- [Requirement 2]

## What You'll Build

[Brief description with screenshot of the end result]

## Step 1: [Action]

[Explanation of what we're doing and why]

1. [Specific instruction]
2. [Specific instruction]

![Screenshot description](/_static/images/tutorial-step1.png)

You should now see [expected result].

## Step 2: [Action]

[Continue pattern...]

## What You've Learned

You have successfully:

- [Skill 1]
- [Skill 2]

## Next Steps

Now that you can [skill], you might want to:

- [Link to related tutorial]
- [Link to how-to for real-world application]
```

### 4.2 How-to Template (User)

```markdown
---
myst:
  html_meta:
    description: "[SEO description]"
    keywords: "[keywords]"
doc_type: how-to
audience: [admin|editor]
tags: [tag1, tag2]
---

# How to [Action]

This guide shows you how to [specific goal].

## Prerequisites

- [Requirement 1]
- [Requirement 2]

## Steps

### 1. [Action]

[Instruction with screenshot if needed]

![Screenshot description](/_static/images/howto-step1.png)

### 2. [Action]

[Instruction]

:::{note}
[Helpful tip or alternative approach]
:::

### 3. [Action]

[Instruction]

## Verification

To confirm [action] worked:

1. [Verification step]
2. [Expected result]

## Troubleshooting

### [Problem 1]

**Symptom:** [What the user sees]

**Solution:** [How to fix it]

## Related

- [Link to related how-to]
- [Link to reference]
```

### 4.3 Reference Template (User)

```markdown
---
myst:
  html_meta:
    description: "[SEO description]"
    keywords: "[keywords]"
doc_type: reference
audience: [admin|editor]
---

# [Feature/Setting Name]

[One-sentence description of what this is and when you'd use it]

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Setting Name** | What it controls | `value` |
| **Setting Name** | What it controls | `value` |

## [Section for each major area]

### [Subsection]

[Description with screenshot if helpful]

![Screenshot description](/_static/images/reference-setting.png)

## See Also

- [Link to how-to that uses this]
- [Link to concept that explains why]
```

### 4.4 Reference Template (Developer)

```markdown
---
myst:
  html_meta:
    description: "[SEO description]"
    keywords: "[keywords]"
doc_type: reference
audience: developer
---

# [Component/API/Behavior Name]

[One-sentence technical description]

## Overview

[Brief technical description - 2-3 sentences max]

## [Schema/Interface/Props]

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `field_name` | `string` | Yes | [Description] |
| `field_name` | `boolean` | No | [Description] |

## Usage

# Example code


## [Additional sections as needed]

## See Also

- [Link to related reference]
- [Link to how-to that uses this]
```

### 4.5 Concept/Explanation Template

```markdown
---
myst:
  html_meta:
    description: "[SEO description]"
    keywords: "[keywords]"
doc_type: explanation
audience: [admin|editor|developer]
related:
  - /path/to/reference
  - /path/to/how-to
---

# [Concept]

[Opening paragraph that frames why this concept matters to the reader]

## How [Concept] Works

[Core explanation - use analogies for non-technical audiences]

[Diagram if helpful]

## Key Principles

### [Principle 1]

[Explanation]

### [Principle 2]

[Explanation]

## [Concept] in Practice

[Real-world examples showing how this concept manifests in the system]

## Common Questions

### "[Question]?"

[Answer]

## Further Reading

- [Link to deeper content]
- [Link to related how-to]
```

---

## 5. Migration Plan

### 5.1 Current State

Existing documentation:
```
docs/docs/
├── index.md                    ✓ Keep, update navigation
├── glossary.md                 ✓ Keep
├── concepts/index.md           ✓ Keep (empty)
├── tutorials/index.md          ✓ Keep (empty)
├── reference/index.md          → Update, add content
└── how-to-guides/
    ├── index.md                ✓ Keep
    ├── passive-targeting.md    → Move to how-to-guides/engagement/
    ├── squared-person-image-support.md → Move to how-to-guides/settings/
    ├── content-interactions.md → Split (user + developer)
    └── content-feedback-form.md → Split (user + developer)
```

### 5.2 Migration Steps

#### Phase 1: Structure Setup

- [ ] Create `/developer/` directory with subdirectories
- [ ] Create subdirectories in `/how-to-guides/` (content, feedback, engagement, settings)
- [ ] Create index.md files for all new directories
- [ ] Update root `index.md` with new navigation

#### Phase 2: Content Migration

**Move without changes:**
- [ ] `passive-targeting.md` → `how-to-guides/engagement/passive-targeting.md`
- [ ] `squared-person-image-support.md` → `how-to-guides/settings/person-image-style.md`

**Split into user + developer docs:**

`content-interactions.md`:
- [ ] User version → `how-to-guides/engagement/enable-likes.md` (configuration steps only)
- [ ] Developer version → `developer/reference/components/content-interactions.md` (component details)

`content-feedback-form.md`:
- [ ] User version → `how-to-guides/feedback/configure-feedback.md` (configuration steps)
- [ ] Developer version → `developer/reference/behaviors/clm.md` (ICLM schema)
- [ ] Developer version → `developer/reference/api/feedback.md` (@feedback endpoint)

#### Phase 3: New Content

Priority order for new documentation:

**High priority (user docs):**
- [ ] `reference/control-panel.md` - All IIntranetSettings options
- [ ] `reference/content-types.md` - Location, Org Unit, Person (user-friendly)
- [ ] `concepts/content-ownership.md` - CLM inheritance explained

**Medium priority (developer docs):**
- [ ] `developer/getting-started/installation.md`
- [ ] `developer/getting-started/project-structure.md`
- [ ] `developer/reference/api/votes.md`
- [ ] `developer/reference/behaviors/` - All behavior schemas

**Lower priority:**
- [ ] Tutorials
- [ ] Additional how-tos based on user needs

#### Phase 4: Validation

- [ ] All pages have required frontmatter
- [ ] No broken internal links
- [ ] All sections have index pages
- [ ] Build completes without warnings
- [ ] Navigation works as expected

---

## 6. Writing Guidelines

### 6.1 General Rules (All Audiences)

**Voice and Tone:**
- Use active voice: "Click the button" not "The button should be clicked"
- Use present tense: "This creates a user" not "This will create a user"
- Be direct: "Do X" not "You might want to do X"
- Be respectful: Never condescend or assume failure

**Structure:**
- Lead with the most important information
- One idea per paragraph
- Maximum 6-8 lines per paragraph
- Use headings to enable scanning

**Technical Writing:**
- Define acronyms on first use
- Use consistent terminology
- Link to glossary for domain terms
- Code in backticks: `setting_name`

### 6.2 User Documentation (Admins + Editors)

**For Admins:**
- Explain the "why" alongside the "how"
- Warn about impacts before instructions
- Include verification steps
- Use screenshots for control panel navigation

**For Editors:**
- Step-by-step with numbered lists
- One action per step
- Screenshot every significant action
- Use everyday language, avoid jargon
- Reassure: "Don't worry, you can undo this"

### 6.3 Developer Documentation

**Style:**
- Technical accuracy over simplicity
- Show code first, explain after
- Include complete, working examples
- Reference specific versions and dependencies
- Link to source code when relevant

**Example - Good:**
```markdown
## Adding a Vote

python
from plone import api

content = api.content.get(path="/my-page")
content.votes = content.votes + [username]


This appends the username to the votes list. The `@votes` endpoint
handles duplicate checking automatically.
```

### 6.4 Screenshots

**When to include:**
- User docs: Every significant UI interaction
- Developer docs: Rarely (prefer code examples)

**Standards:**
- Consistent browser width (1280px recommended)
- Highlight focus area with annotation if needed
- Crop to relevant area
- Use PNG format
- Store in: `docs/_static/images/`
- Alt text: Describe what the user should see

---

## 7. Quick Reference

### Document Type Decision Tree

```
Is the reader learning something new?
├─ Yes → Is it a guided, hands-on experience?
│        ├─ Yes → TUTORIAL
│        └─ No → EXPLANATION (concepts/)
└─ No → Are they trying to accomplish a task?
         ├─ Yes → HOW-TO
         └─ No → REFERENCE
```

### Location Decision Tree

```
Does the reader need to write code to use this information?
├─ Yes → /developer/
│        └─ What type? → tutorials/, how-to-guides/, reference/, concepts/
└─ No → Root level
         └─ What type? → tutorials/, how-to-guides/, reference/, concepts/
```

### Audience Tag Decision

```
Within user docs (root level), who is this primarily for?
├─ Configures system settings, manages users → audience: admin
├─ Creates and edits content → audience: editor
└─ Both equally → audience: admin (default to more technical)
```

---

## 8. Feature Documentation Map

This maps kitconcept.intranet features to documentation locations:

| Feature | User Doc Location | Developer Doc Location |
|---------|------------------|----------------------|
| **Content Types** | | |
| - Person | `reference/content-types.md` | `developer/reference/behaviors/person.md` |
| - Location | `reference/content-types.md` | `developer/reference/behaviors/location.md` |
| - Organisational Unit | `reference/content-types.md` | `developer/reference/behaviors/organisational-unit.md` |
| **Feedback System** | | |
| - Configuration | `how-to-guides/feedback/configure-feedback.md` | - |
| - Submitting | `how-to-guides/feedback/submit-feedback.md` | - |
| - CLM Behavior | - | `developer/reference/behaviors/clm.md` |
| - @feedback API | - | `developer/reference/api/feedback.md` |
| **Likes/Rating** | | |
| - Enable likes | `how-to-guides/engagement/enable-likes.md` | - |
| - Votes behavior | - | `developer/reference/behaviors/votes.md` |
| - @votes API | - | `developer/reference/api/votes.md` |
| **Passive Targeting** | | |
| - Using | `how-to-guides/engagement/passive-targeting.md` | - |
| - Concept | `concepts/personalization.md` | - |
| **Control Panel** | | |
| - All settings | `reference/control-panel.md` | `developer/reference/registry.md` |
| **Components** | | |
| - ContentInteractions | - | `developer/reference/components/content-interactions.md` |
| - FeedbackForm | - | `developer/reference/components/feedback-form.md` |
| - PersonView | - | `developer/reference/components/person-view.md` |

---