from datetime import date
from plone import api
from zope.component.hooks import setSite


portal = app.Plone
setSite(portal)

with api.env.adopt_roles(["Manager"]):
    brains = portal.portal_catalog.unrestrictedSearchResults(
        review_due_date=date.today()
    )
    for brain in brains:
        obj = brain.getObject()
        reviewer = api.user.get(
            obj.review_assignee if obj.review_assignee else obj.Creator()
        )

        breakpoint()
        mail_subject = "Lorem Ipsum"
        mail_body = "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."

        api.portal.send_email(
            recipient=reviewer.getProperty("email"),
            subject=mail_subject,
            body=mail_body,
        )
