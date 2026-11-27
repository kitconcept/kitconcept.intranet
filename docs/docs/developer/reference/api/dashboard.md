---
myst:
  html_meta:
    description: "REST API reference for the @dashboard endpoint, which returns the default dashboard blocks and creates a user's dashboard."
    keywords: "API, dashboard, REST, @dashboard, Person, Dashboard content type"
doc_type: reference
audience: developer
status: draft
last_updated: 2026-11-27
---

# @dashboard Endpoint

The `@dashboard` endpoint serves the personal dashboard of the **current user**.
It is registered on Person content (`collective.person.content.person.IPerson`)
and requires the `View` permission on the Person. Each method also checks that the
Person belongs to the current user: the Person's username must equal the current
user's ID.

The dashboard itself is a `Dashboard` item with the id `dashboard` inside the
Person. Once it exists, read and edit it with the standard content endpoints
(`GET`/`PATCH /<person>/dashboard`).

## `GET /@dashboard`

Returns the default blocks of the `Dashboard` content type. The frontend uses it
to show a dashboard that hasn't been created yet.

**Example:**

```http
GET /personen/david-schmidt/@dashboard HTTP/1.1
Accept: application/json
```

**Response:**

```json
{
  "blocks": {
    "6b5c3a1e-2f4d-4c8a-9e7b-1d2f3a4b5c6d": { "@type": "title" },
    "c1069b10-3a69-4fd2-a104-d1424521b8dc": { "@type": "slate" }
  },
  "blocks_layout": {
    "items": [
      "6b5c3a1e-2f4d-4c8a-9e7b-1d2f3a4b5c6d",
      "c1069b10-3a69-4fd2-a104-d1424521b8dc"
    ]
  }
}
```

The response is shortened: the shipped default also contains four `gridBlock`
blocks with seven `listing` blocks.

`blocks` goes through the same block serialization transformers as the content
`blocks` field. For example, `resolveuid` links become URLs. The Person is the
context, because the dashboard doesn't exist yet.

***

## `POST /@dashboard`

Creates the current user's dashboard inside the Person and returns its URL. If
the dashboard already exists, it is kept unchanged and its URL is returned.

**Request body:** none.

**Example:**

```http
POST /personen/david-schmidt/@dashboard HTTP/1.1
Accept: application/json
```

**Response:** `201 Created`

```json
{
  "@id": "http://localhost:3000/personen/david-schmidt/dashboard"
}
```

**Side effects** (on first call only):

- Creates a `Dashboard` with the id `dashboard` and the title `Dashboard`. The
  type constraints of the Person are skipped, because `Dashboard` is not an
  allowed type there and users can't add content to their Person.
- The new dashboard starts with the default blocks of the content type, in the
  `private` state of `dashboard_workflow`, with the current user as Owner.
- Blocks local role inheritance (`__ac_local_roles_block__`), so roles on the
  Person don't grant access to the dashboard.

## Error responses

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | The Person doesn't belong to the current user. This also applies to Site Administrators and Managers. |
| `401 Unauthorized` | Anonymous user, or the Person has no username. |
| `401 Unauthorized` | The current user can't view the Person. |
| `404 Not Found` | The context isn't a Person. |

## The `Dashboard` content type

| Property | Value |
|----------|-------|
| Behaviors | `plone.basic`, `volto.blocks.editable.layout`, `plone.versioning`, `plone.locking` |
| Addable | No (`global_allow` is `False`); only `POST /@dashboard` creates it. |
| Workflow | `dashboard_workflow`: one state, `private`. `View`, `Access contents information` and `Modify portal content` are granted to Owner, Site Administrator and Manager. |
| Versioning | `at_edit_autoversion` and `version_on_revert` policies in `repositorytool.xml`. |

The default layout is stored in the type's `model_source` as the defaults of the
`blocks` and `blocks_layout` fields. Site administrators edit it through the
Volto layout editor (`PATCH /@types/Dashboard`).

`Dashboard.xml` intentionally doesn't set `model_source`: re-importing
`typeinfo` would overwrite a layout edited through the web. The shipped layout
is set by `kitconcept.intranet.upgrades.set_dashboard_layout`. It runs from the
install handler and the `20261126001` upgrade step, and does nothing if the type
already has a `blocks` field.

## Related change to `PATCH /@types`

The Volto layout editor sends the selected block ID as `selected` along with
`blocks` and `blocks_layout`. The intranet overrides `PATCH /@types` to ignore
`selected`; otherwise `plone.restapi` tries to create a `selected` field, fails
with `400` and rolls back the whole save. This applies to the layout of every
content type, not only `Dashboard`.

## Frontend

- `DashboardView` handles the route `/**/dashboard`. It loads the dashboard if it
  exists. On `404`, it calls `GET /@dashboard` on the parent Person and renders
  the default blocks. The **Edit** button calls `POST /@dashboard` and opens
  `<person>/dashboard/edit`.
- `DashboardMenu` adds the **Dashboard** link to the toolbar user menu
  (`toolbar-user-menu` pluggable). It finds the Person by searching for
  `portal_type: Person` with the current user's `username`.

## See also

- [Admin: set the default dashboard layout](/how-to-guides/settings/set-default-dashboard-layout)
- {doc}`/features/personal-dashboard`
- {doc}`/developer/concepts/security-model`
