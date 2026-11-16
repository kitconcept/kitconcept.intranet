"""Emails to the users watching a content item when it changes.

Changes are collected per transaction and each changed item gets one email
per watcher, however many events a save fires. The emails are built in a
before-commit hook, while the content and the security context are still
available, and sent in an after-commit hook, so an aborted transaction sends
nothing and a mail server error never breaks the save.
"""

from dataclasses import dataclass
from dataclasses import field
from DateTime import DateTime
from kitconcept.intranet.behaviors.watchers import IWatchers
from plone import api
from plone.app.iterate.interfaces import IWorkingCopy
from plone.app.uuid.utils import uuidToObject
from plone.uuid.interfaces import IUUID
from zope.annotation.interfaces import IAnnotations
from zope.globalrequest import getRequest

import logging
import transaction


logger = logging.getLogger("kitconcept.intranet")

SETTING = "kitconcept.intranet.enable_content_watching"
PUBLISHED = "published"
CHANGE_NOTE_KEY = "plone.app.versioningbehavior-changeNote"


@dataclass
class Change:
    uid: str
    editor: str | None
    change_note: str | None = None


@dataclass
class Mail:
    recipient: str
    subject: str
    body: str


@dataclass
class PendingChanges:
    changes: dict[str, Change] = field(default_factory=dict)
    mails: list[Mail] = field(default_factory=list)


def watching_enabled() -> bool:
    return bool(api.portal.get_registry_record(SETTING, default=False))


def _current_userid() -> str | None:
    if api.user.is_anonymous():
        return None
    return api.user.get_current().getId()


def _request_change_note() -> str | None:
    request = getRequest()
    if request is None:
        return None
    return IAnnotations(request).get(CHANGE_NOTE_KEY) or None


def _pending() -> PendingChanges:
    txn = transaction.get()
    try:
        return txn.data(_pending)
    except KeyError:
        pending = PendingChanges()
        txn.set_data(_pending, pending)
        txn.addBeforeCommitHook(_build_mails, (pending,))
        txn.addAfterCommitHook(_send_mails, (pending,))
        return pending


def queue_change(obj, change_note: str | None = None) -> None:
    """Remember that ``obj`` changed in the current transaction."""
    if IWorkingCopy.providedBy(obj) or not watching_enabled():
        return
    if not IWatchers(obj).userids():
        return
    uid = IUUID(obj, None)
    if uid is None:
        return
    note = change_note or _request_change_note()
    changes = _pending().changes
    change = changes.get(uid)
    if change is None:
        changes[uid] = Change(uid=uid, editor=_current_userid(), change_note=note)
    elif note and not change.change_note:
        change.change_note = note


def is_published(obj) -> bool:
    """Content without a workflow follows its parent; View is checked anyway."""
    state = api.content.get_state(obj=obj, default=None)
    return state is None or state == PUBLISHED


def _fullname(user) -> str:
    return user.getProperty("fullname") or user.getUserName() or user.getId()


def recipients(obj, editor: str | None) -> list:
    """Watchers who can view the item and have an email address.

    The user who made the change gets no email.
    """
    users = []
    for userid in IWatchers(obj).userids():
        if userid == editor:
            continue
        user = api.user.get(userid=userid)
        if user is None or not user.getProperty("email"):
            continue
        if not api.user.has_permission("View", user=user, obj=obj):
            continue
        users.append(user)
    return users


def _language(obj) -> str:
    languages = api.portal.get_tool("portal_languages")
    lang = getattr(obj, "language", None) or languages.getDefaultLanguage()
    return "de" if lang.startswith("de") else "en"


def compose(obj, recipient_name: str, editor_name: str | None, change_note):
    """Return the subject and the body of the email in the item's language."""
    title = obj.Title()
    url = obj.absolute_url()
    history_url = f"{url}/history"
    lang = _language(obj)
    now = DateTime()

    if lang == "de":
        subject = f"Änderung an „{title}“"
        lines = [
            f"Hallo {recipient_name},",
            "",
            f"der Inhalt „{title}“, den Sie beobachten, wurde geändert.",
            "",
        ]
        if editor_name:
            lines.append(f"Geändert von: {editor_name}")
        lines.append(f"Geändert am: {now.strftime('%d.%m.%Y, %H:%M')} Uhr")
        if change_note:
            lines.append(f"Änderungsnotiz: {change_note}")
        lines += [
            "",
            "Inhalt ansehen:",
            url,
            "",
            "Was sich geändert hat, sehen Sie in der Versionshistorie:",
            history_url,
            "",
            "Sie erhalten diese E-Mail, weil Sie diesen Inhalt beobachten. "
            "Um die Beobachtung zu beenden, öffnen Sie den Inhalt und klicken "
            "Sie auf das Augen-Symbol.",
            "",
            "Mit freundlichen Grüßen",
            "Ihr Intranet-Team",
        ]
    else:
        subject = f"Update to “{title}”"
        lines = [
            f"Hello {recipient_name},",
            "",
            f"The content “{title}” you are watching has been updated.",
            "",
        ]
        if editor_name:
            lines.append(f"Changed by: {editor_name}")
        lines.append(f"Changed on: {now.strftime('%Y-%m-%d, %H:%M')}")
        if change_note:
            lines.append(f"Change note: {change_note}")
        lines += [
            "",
            "View the content:",
            url,
            "",
            "See what has changed in the version history:",
            history_url,
            "",
            "You receive this email because you are watching this content. "
            "To stop watching, open the content and click the eye icon.",
            "",
            "Kind regards",
            "Your intranet team",
        ]
    return subject, "\n".join(lines)


def _build_mails(pending: PendingChanges) -> None:
    try:
        for change in pending.changes.values():
            obj = uuidToObject(change.uid, unrestricted=True)
            if obj is None or not is_published(obj):
                continue
            editor = api.user.get(userid=change.editor) if change.editor else None
            editor_name = _fullname(editor) if editor else None
            for user in recipients(obj, change.editor):
                subject, body = compose(
                    obj, _fullname(user), editor_name, change.change_note
                )
                pending.mails.append(Mail(user.getProperty("email"), subject, body))
    except Exception:
        # Never break the save because of a notification.
        logger.exception("Could not prepare the watch notifications.")
        pending.mails.clear()


def send_mail(mail: Mail) -> None:
    api.portal.send_email(
        recipient=mail.recipient,
        subject=mail.subject,
        body=mail.body,
        immediate=True,
    )


def _send_mails(committed: bool, pending: PendingChanges) -> None:
    if not committed:
        return
    for mail in pending.mails:
        try:
            send_mail(mail)
        except Exception:
            logger.exception(
                f"Could not send the watch notification to {mail.recipient}."
            )
