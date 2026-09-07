---
myst:
  html_meta:
    description: "Content review and reminders feature — review scheduling, approve/delegate/postpone workflow, and email reminders when content is due."
    keywords: "content review, reminders, review due date, approve, delegate, postpone, review assignee, lifecycle"
doc_type: feature
audience: user
status: draft
last_updated: 2026-09-07
---

# Content Review & Reminders

:::{admonition} Feature summary
:class: note

**Status:** GA (off by default — see enablement) · **Audience:** editors, admins ·
**Interim source of truth** — canonical spec will move to the intranet.
:::

## Summary

Content Review & Reminders keeps intranet content current. Each item can carry a
**next review date** and a **review interval**; when a review falls due, the
assigned reviewer is emailed. Reviewers act on content from a toolbar review menu
— marking it reviewed, delegating it, or postponing it — and the next review date
is recalculated automatically.

## Who it's for

- **Reviewers / editors** are reminded when their content needs checking and act
  on it from the toolbar.
- **Administrators** enable the feature site-wide and set the default review
  interval.

## Capabilities

- Per-item **review scheduling** — interval, next-review date, assignee, status.
- A **review action menu** in the toolbar: Mark as Reviewed, Delegate, Postpone.
- **Automatic recalculation** of the next review date on approval.
- **Daily email reminders** to the assignee (or the content's creator as
  fallback), bilingual (German / English).
- A **"timeless"** flag to exclude content that never needs review.
- Site-wide **on/off toggle** and **default interval** in the control panel.

## The fields

Provided by the `content_review` behavior (fieldset **"Content Review &
Reminders"**), applied to **Document, Event, Image, File, Link, Location,
Organisational Unit, News Item, and Person** (9 types).

| Field | Type | Editable? | Default | Purpose |
|-------|------|-----------|---------|---------|
| `review_timeless` | Bool | Yes | `False` | Mark content that never needs review; excludes it from reminders. |
| `review_status` | Choice | Read-only | `Up-to-date` | `Up-to-date` / `Due` / `Changes requested`. |
| `review_interval` | Choice | Yes | site default (`6m`) | How often to review: `3m`, `6m`, `1y`, `2y`. |
| `review_assignee` | Choice (Users) | Yes | — | Who is responsible for the review (falls back to content owner/creator). |
| `review_due_date` | Date | Yes | computed from interval | Next review date. |
| `review_completed_date` | Date | Read-only | — | Last review date. |
| `review_comment` | Text | Read-only | — | Comment recorded by a review action. |

## Behaviour & rules

:::{admonition} For QA and product owners
:class: tip
This section is the behavioural spec. Treat each rule as a testable assertion.
:::

### Scheduling & validation

- The next review date defaults to **today + the review interval**. Interval
  tokens are `<number><unit>` where unit is `d/w/m/y` (e.g. `6m`, `1y`).
- If `review_interval` is unset, the **site default interval** (control panel,
  default `6m`) is used.
- **Invariant:** non-timeless content **must** have a due date; timeless content
  **must not** have one. Violating either is rejected on save.

### Review actions (`@review` API)

Reviewers act via a toolbar menu backed by a `@review` endpoint. All actions
require the `Modify portal content` permission.

- **Mark as Reviewed (approve)** — sets status to `Up-to-date`, sets
  `review_completed_date` to today, and **recalculates** `review_due_date` from
  the item's interval (or the site default).
- **Delegate** — reassigns `review_assignee` to a chosen user (validated against
  the Users vocabulary) and optionally records a comment. Invalid assignee is
  rejected.
- **Postpone** — sets status back to `Up-to-date`, optionally records a comment,
  and optionally sets a new due date; if no date is given, the existing due date
  is unchanged. Does **not** set the completed date.
- Any other action is rejected with an error.

### Reminder job

- A scheduled job runs **daily** and selects content whose `review_due_date` is
  **exactly today** (not overdue / not `<=` today).
- The reminder is emailed to the **`review_assignee`** if set, otherwise the
  item's **creator**.
- If no user can be resolved for an item, it is **skipped and logged** — no email
  is sent.
- Emails are sent in the **content's language**, falling back to the site default
  language; only German and English templates exist (other languages fall back to
  English).
- The job only sends email — it does **not** change `review_status` or any field
  after sending.

### Visibility

- The review toolbar menu appears only when the feature is enabled site-wide, and
  the Review button is **disabled unless the item is published**.
- When the feature is disabled, the "Content Review & Reminders" fieldset is
  **hidden** from the content's edit form / `@types` response.

:::{admonition} Known gaps (verify before relying on)
:class: warning

Observed in the current implementation and worth flagging to product/QA:

- **"Mark Changes Required"** exists as a toolbar button but is **not wired** —
  it has no handler and no API action. The `Changes requested` status value is
  defined but nothing sets it.
- A **`Reviewers` group vocabulary** exists but is unused; assignee selection uses
  the full Users vocabulary instead.
- The reminder matches the due date **exactly on the day** — content that becomes
  overdue (e.g. missed because the job didn't run) is not re-notified.
- There is **no catalog index for `review_assignee`**.
:::

:::{note}
This feature is part of the broader content lifecycle but is driven by the
separate `content_review` behavior, **not** the CLM ownership fields. Ownership
and feedback routing are covered in {doc}`content-lifecycle-management`.
:::

## Configuration / enablement

- Enable the feature site-wide with **`enable_content_review`** (control panel;
  **off by default**).
- Set the **default review interval** (`content_review_default_interval`, default
  `6m`) in the control panel.
- Set per-item interval, assignee, due date, and the timeless flag on the content
  edit form.
- The reminder job runs as a scheduled task in the deployment (a Docker Swarm
  cron job at daily midnight) — see the developer how-to.

## Learn more

- **How-to (editor)** — {doc}`/how-to-guides/settings/content-review`
- **How-to (developer)** —
  {doc}`/developer/how-to-guides/configure-reminders-for-content`
- **Reference (API)** — {doc}`/developer/reference/api/review` (`@review`
  endpoint)
- **Related feature** — {doc}`content-lifecycle-management`
