---
myst:
  html_meta:
    description: "Turn on watching content for your kitconcept intranet and make sure the watch emails can be sent."
    keywords: "how-to, watch, watching, notification, email, admin, control panel"
doc_type: how-to
audience: admin
tags: [engagement, watch, notifications]
last_updated: 2026-11-16
---

# Enable watching content

This guide shows you how to turn on watching content, so logged-in users can
watch an item and get an email when it changes.

## Prerequisites

- You have admin access to the site setup.
- Your site can send email (mail server settings in **Site setup → Mail**).

## Steps

### 1. Set the sender address

Go to **Site setup → Mail** and fill in **Site 'From' address** (and, if you
like, **Site 'From' name**). Watch emails use it as their sender.

:::{important}
Without a sender address no watch email can be sent. The save still works, but
the email is skipped and an error is logged.
:::

### 2. Turn on the setting

Go to **Site setup → Intranet Settings** and turn on
**Enable Watching Content**. Save.

New sites have it **on** already. Sites upgraded from an earlier version have
it **off**, so you need this step there.

## Verification

1. Log in as a user with an email address, open a published page, and select
   **Watch** in the **About this content** box.
2. Log in as another user who can edit the page, change it, and save.
3. The first user gets an email with the subject `Update to "<title>"`
   (`Änderung an „<title>"` on German content).

:::{tip}
On a local development backend no email is sent: the printing mail host writes
each email to the backend console instead.
:::

## Turn it off again

Turn off **Enable Watching Content**. The watch button disappears and no more
watch emails are sent. The users' watches are kept, so they take effect again if
you turn the setting back on.

## See also

- {doc}`/features/watch-content`
- {doc}`watch-content`
- {doc}`/reference/control-panel`
