from kitconcept.solr.reindex_helpers import activate_and_reindex
from Testing.makerequest import makerequest
from zope.site.hooks import setSite

import sys
import transaction


if __name__ == "__main__":
    app = makerequest(globals()["app"])

    # Set site to Plone
    site_id = "Plone"
    portal = app.unrestrictedTraverse(site_id)
    setSite(portal)

    activate_and_reindex(portal, clear="--clear" in sys.argv)

    transaction.commit()
    app._p_jar.sync()
