---
myst:
  html_meta:
    description: "Reference for the WatchButton React component — the toggle to start and stop watching content."
    keywords: "WatchButton, EyeIcon, watch, toggle, component, developer"
doc_type: reference
audience: developer
status: draft
last_updated: 2026-11-16
---

# WatchButton

The **WatchButton** component is the toggle a logged-in user selects to start or
stop watching the current content item.

| Labelled (in *About this content*) | Eye-only (in *ContentInteractions*) |
|---|---|
| ![Watch button, not watching](/_static/images/watch-content-not-watching.png) | ![Eye-only toggle, not watching](/_static/images/watch-content-eye-only.png) |
| ![Watch button, watching](/_static/images/watch-content-watching.png) | ![Eye-only toggle, watching](/_static/images/watch-content-eye-only-watching.png) |

## Component location

```text
src/components/WatchButton/WatchButton.jsx
src/components/WatchButton/EyeIcon.jsx
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showLabel` | boolean | `false` | Show the text **Watch** / **Watching** next to the eye. |
| `size` | number | `33` | Width and height of the eye icon, in pixels. |
| `className` | string | — | Extra class name for the button. |

## Behavior

- Reads the current content (`state.content.data`), the site settings
  (`state.site.data`) and the session from Redux; it takes no content prop.
- Renders **nothing** unless all of these are true:
  - `kitconcept.intranet.enable_content_watching` is on (from `@site`),
  - the content has the `watch` component (that is, the
    `kitconcept.intranet.watchers` behavior),
  - the user is logged in.
- Its initial state is `@components.watch.watching`, which needs the `watch`
  expander in `config.settings.apiExpanders`.
- Selecting it dispatches `toggleWatch(url)` (`actions/watch/watch.js`, action type
  `TOGGLE_WATCH`, `POST <url>/@watch`) and sets the state from the response.
  It shows a success toast for both directions, and an error toast if the
  request fails.

## Accessibility

- It is a `ToggleButton` from `@plone/components` (React Aria), so it exposes
  `aria-pressed`.
- The accessible name stays **Watch this content**; the pressed state carries
  the meaning. The hover text (`title`) says what selecting it will do (**Watch this content** /
  **Stop watching this content**).
- The label text is `aria-hidden`, so it isn't read twice.

## Styling

| Class | Meaning |
|-------|---------|
| `.watch-button` | Always present. |
| `.watching` | Present while the user watches the item. Use it for the pressed style. |
| `.eye-icon` | The SVG icon. |

The icon is drawn with `currentColor`, so it follows the button's `color`.
`EyeIcon` takes `filled` (watching) and `size`.

Existing styles:

- `theme/slots.scss`, `.about-content-header .watch-button`—the labelled button
  in the *About this content* box.
- `theme/components/contentInteractions.scss`,
  `button.watch-button.watch-section`—the round eye-only button.

## Where it's used

| Place | Usage |
|-------|-------|
| `slots/AboutThisContent/AboutThisContent.tsx` | `<WatchButton showLabel size={24} />` in the box header. The box is shown on Document, News Item, Event, WikiPage and Workspace; the button appears only on the types with the behavior. |
| `components/ContentInteractions/ContentInteractions.jsx` | `<WatchButton className="watch-section" size={28} />` next to Like (all other types that show the bar). |

## See also

- {doc}`/developer/concepts/watch-content`
- {doc}`/developer/reference/api/watch`
- {doc}`content-interactions`
