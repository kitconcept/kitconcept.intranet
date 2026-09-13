from datetime import date
from plone import api

import logging


logger = logging.getLogger("kitconcept.intranet")


def nofity_reviewer(portal):
    brains = portal.portal_catalog.unrestrictedSearchResults(
        review_due_date=date.today()
    )
    for brain in brains:
        obj = brain.getObject()
        reviewer = api.user.get(
            obj.review_assignee if obj.review_assignee else obj.Creator()
        )

        if not reviewer:
            logger.warning(
                f"Couldn't find user for {brain.getPath()}. No mail will be sent."
            )
            continue

        owner_name = reviewer.getProperty("fullname") or reviewer.getUserName()
        last_updated = obj.modified().strftime("%Y-%m-%d")

        mail_subject = {
            "de": f"🔔 Erinnerung: Inhaltsprüfung fällig für „{obj.Title()}“",
            "en": f"🔔 Reminder: Content review due for “{obj.Title()}”",
        }
        mail_body = {
            "de": (
                f"Hallo {owner_name},\n\n"
                f"der Inhalt „{obj.Title()}“ ist zur Überprüfung fällig.\n"
                "Bitte prüfen Sie, ob die Informationen noch aktuell und "
                "korrekt sind.\n\n"
                f"Letzte Aktualisierung: {last_updated}\n"
                "Nächste Kontrolle (nach Prüfung): wird automatisch neu "
                "berechnet\n\n"
                "Sie können den Inhalt hier aufrufen:\n"
                f"👉 {obj.absolute_url()}\n\n"
                "Ihre Optionen:\n"
                "- ✅ Inhalt prüfen und als „geprüft“ markieren\n"
                "- 🕓 Nächste Kontrolle verschieben (z. B. in 3 oder 6 Monaten)\n"
                "- 📝 Inhalt als „Überarbeitung erforderlich“ markieren, falls "
                "Änderungen notwendig sind\n\n"
                "Vielen Dank, dass Sie dafür sorgen, dass unsere "
                "Inhalte aktuell bleiben.\n\n"
                "Mit freundlichen Grüßen,\n"
                "Ihr Intranet-Team"
            ),
            "en": (
                f"Hello {owner_name},\n\n"
                f"The content item “{obj.Title()}” is due for review.\n"
                "Please check whether the information is still accurate and "
                "up to date.\n\n"
                f"Last updated: {last_updated}\n"
                "Next review date (after completion): will be recalculated "
                "automatically.\n\n"
                "You can open the content here:\n"
                f"👉 {obj.absolute_url()}\n\n"
                "Available actions:\n"
                "- ✅ Review the content and mark as reviewed\n"
                "- 🕓 Postpone next review (e.g., by 3 or 6 months)\n"
                "- 📝 Mark as “changes required” if updates are needed\n\n"
                "Thank you for keeping our content accurate and relevant.\n\n"
                "Kind regards,\n"
                "Your intranet team"
            ),
        }

        languages = api.portal.get_tool("portal_languages")
        lang = obj.language or languages.getDefaultLanguage()

        api.portal.send_email(
            recipient=reviewer.getProperty("email"),
            subject=mail_subject.get(lang, mail_subject.get("en")),
            body=mail_body.get(lang, mail_body.get("en")),
            immediate=True,
        )
