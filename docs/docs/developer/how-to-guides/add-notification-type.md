---
myst:
  html_meta:
    description: "Add a new notification type to the notification center, in the backend and the frontend."
    keywords: "how-to, developer, notifications, notification type, subscriber, event"
doc_type: how-to
audience: developer
status: draft
last_updated: 2026-11-16
---

# Add a notification type

This guide shows you how to add a notification type to the notification center.
As an example, it adds a `comment` type: authors are notified when someone comments on their content.

A type needs changes in the backend, which creates and stores the notifications, and in the frontend, which renders them and offers a preference for them.
Ship both together: the frontend sends every type it knows to `PATCH @notifications-settings`, and the backend rejects types it doesn't know.

For how the parts fit together, see {doc}`/developer/concepts/notifications`.

## Prerequisites

- A development setup of this repository. See {doc}`/developer/getting-started/installation`.
- An event, or a place in the code, that tells you when the activity happens.
  For comments, `plone.app.discussion` fires `ICommentAddedEvent` on the commented item.

## Register the type in the backend

In `backend/src/kitconcept/intranet/notifications/storage.py`, add the type to `NOTIFICATION_TYPES`:

```python
NOTIFICATION_TYPES = ("like", "modified", "transition", "comment")
```

`DEFAULT_SETTINGS` is derived from this tuple, so the new type is on for everyone by default, and `@notifications-settings` accepts it.

## Create the notifications

Add a subscriber to `backend/src/kitconcept/intranet/notifications/subscribers.py`.
Call `notify_authors`: it notifies every creator of the item except the current user, honours their preferences, and never raises.

```python
def commented(obj, event) -> None:
    notify_authors(obj, "comment")
```

Pass a dictionary as the third argument to store extra keys with the notification.
They're returned as they are by `GET @notifications`.

```python
def commented(obj, event) -> None:
    notify_authors(obj, "comment", {"comment_id": event.comment.comment_id})
```

Register the subscriber in `backend/src/kitconcept/intranet/notifications/configure.zcml`:

```xml
<subscriber
    for="plone.dexterity.interfaces.IDexterityContent
         plone.app.discussion.interfaces.ICommentAddedEvent"
    handler=".subscribers.commented"
    />
```

`ICommentAddedEvent` covers top-level comments only.
Replies fire `IReplyAddedEvent`; subscribe to it too if you want them.

If there's no event for your activity, call `notify_authors` directly where it happens, as the `@vote` service does for likes.

To notify someone other than the creators, call `storage.add_notification(userid, type_, actor, obj, extra)` for each recipient.
It skips the actor and recipients who switched the type off.

## Test the backend

Add a test to `backend/tests/notifications/test_notifications.py`.
The `author_session` and `editor_session` fixtures there are logged in as a page's creator and as another user.

```python
def test_comment_notifies_author(self, author_session, editor_session):
    # As the editor, add a comment to the author's page through @comments.
    ...
    response = author_session.get("/@notifications")
    assert response.json()["items"][0]["type"] == "comment"
```

Run the tests:

```shell
make -C backend test
```

## Render the type in the frontend

In `frontend/packages/kitconcept-intranet/src/components/Notifications/helpers.ts`:

1.  Extend the type and the list.
    The list sets the order of the preferences checkboxes.

    ```ts
    export type NotificationType = 'like' | 'modified' | 'transition' | 'comment';

    export const NOTIFICATION_TYPES: NotificationType[] = [
      'like',
      'modified',
      'transition',
      'comment',
    ];
    ```

2.  Add a message for the notification text, under the type's name, and one for its preference.
    The notification text can use the `actor` and `title` values.

    ```ts
    comment: {
      id: 'notificationComment',
      defaultMessage: '{actor} commented on {title}',
    },
    settingComment: {
      id: 'notificationSettingComment',
      defaultMessage: 'Someone comments on content I author',
    },
    ```

3.  Map the type to its preference message:

    ```ts
    export const settingMessages = {
      like: messages.settingLike,
      modified: messages.settingModified,
      transition: messages.settingTransition,
      comment: messages.settingComment,
    };
    ```

In `NotificationItem.tsx`, give the type an icon from `lucide-react`:

```tsx
import { Check, Heart, MessageSquare, Pencil, Workflow } from 'lucide-react';

const icons = {
  like: Heart,
  modified: Pencil,
  transition: Workflow,
  comment: MessageSquare,
};
```

## Translate the messages

Update the message catalogs, then add the German translations to `frontend/packages/kitconcept-intranet/locales/de/LC_MESSAGES/volto.po`:

```shell
make -C frontend i18n
```

## Check the result

1.  Run the frontend checks:

    ```shell
    make -C frontend format
    make -C frontend lint
    make -C frontend test
    ```

2.  Start the backend and the frontend, and log in as the author of a page.
3.  As another user, comment on the page.
4.  As the author, open any page.
    The bell shows a notification that the other user commented on the page.
5.  Open `/notifications` and the gear button.
    **Someone comments on content I author** is listed and ticked.

## Add news fragments

The change touches both the backend and the frontend package, so add a fragment to each:

- `backend/news/+comment-notifications.feature`
- `frontend/packages/kitconcept-intranet/news/+comment-notifications.feature`

## See also

- {doc}`/developer/concepts/notifications`
- {doc}`/developer/reference/api/notifications`
- {doc}`/developer/reference/components/notifications`
