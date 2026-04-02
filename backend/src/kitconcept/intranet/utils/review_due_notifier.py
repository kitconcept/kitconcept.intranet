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
            logger.warning("Couldn't find user. No mail will be sent.")
            return

        breakpoint()
        mail_subject = f"🔔 Reminder: Content review due for {obj.Title()}"
        mail_body = (
            f"Hello {reviewer.getProperty('fullname') or reviewer.getUserName()},"
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
        )

        api.portal.send_email(
            recipient=reviewer.getProperty("email"),
            subject=mail_subject,
            body=mail_body,
            immediate=True,
        )
