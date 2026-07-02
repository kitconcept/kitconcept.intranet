from kitconcept.intranet.utils.review_due_notifier import nofity_reviewer
from plone import api
from zope.component.hooks import setSite


app = globals()["app"]
portal = app.Plone
setSite(portal)

with api.env.adopt_roles(["Manager"]):
    nofity_reviewer(portal)
