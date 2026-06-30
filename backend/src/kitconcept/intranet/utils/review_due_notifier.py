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

        mail_subject = {
            "de": f"🔔 Erinnerung: Inhaltsprüfung fällig für „{obj.Title()}“",
            "en": f"🔔 Reminder: Content review due for “{obj.Title()}”",
        }
        mail_body = {
            "de": (
                f"Hallo {owner_name},"
                f"der Inhalt „{obj.Title()}“ ist zur Überprüfung fällig."
                "Bitte prüfen Sie, ob die Informationen noch aktuell und korrekt sind."
                f"Letzte Aktualisierung: {obj}"
                "Nächste Kontrolle (nach Prüfung): wird automatisch neu berechnet"
                f"Sie können den Inhalt hier aufrufen:"
                f"👉 {obj.absolute_url()}"
                "Ihre Optionen:"
                "- ✅ Inhalt prüfen und als „geprüft“ markieren"
                "- 🕓 Nächste Kontrolle verschieben (z. B. in 3 oder 6 Monaten)"
                "- 📝 Inhalt als „Überarbeitung erforderlich“ markieren, falls Änderungen notwendig sind"
                "Vielen Dank, dass Sie dafür sorgen, dass unsere Inhalte aktuell bleiben."
                "Mit freundlichen Grüßen,"
                "Ihr Intranet-Team"
            ),
            "en": (
                f"Hello {owner_name},"
                f"The content item “{obj.Title()}” is due for review."
                "Please check whether the information is still accurate and up to date."
                f"Last updated: {obj}"
                "Next review date (after completion): will be recalculated automatically"
                "You can open the content here:"
                f"👉 {obj.absolute_url()}"
                "Available actions:"
                "- ✅ Review the content and mark as reviewed"
                "- 🕓 Postpone next review (e.g., by 3 or 6 months)"
                "- 📝 Mark as “changes required” if updates are needed"
                "Thank you for keeping our content accurate and relevant."
                "Kind regards,"
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
