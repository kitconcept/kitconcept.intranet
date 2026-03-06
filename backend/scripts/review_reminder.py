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
        # TODO: send mail to assignee or content owner
