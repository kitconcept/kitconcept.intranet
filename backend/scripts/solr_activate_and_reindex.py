from kitconcept.solr.reindex_helpers import activate_and_reindex
from plone import api
from Products.GenericSetup.tool import SetupTool
from Testing.makerequest import makerequest
from zope.component.hooks import site

import sys
import transaction


if __name__ == "__main__":
    """Activate and reindex Solr for the Plone site."""

    app = makerequest(globals()["app"])

    # Set site to Plone
    site_id = "Plone"
    portal = app.unrestrictedTraverse(site_id)
    with site(portal):
        setup_tool: SetupTool = api.portal.get_tool("portal_setup")
        version = setup_tool.getLastVersionForProfile("kitconcept.intranet:solr")
        if version == "unknown":
            print("Solr is not configured for this Plone site.")
        else:
            with transaction.manager as tm:
                activate_and_reindex(portal, clear="--clear" in sys.argv)
                tm.note("Activated and reindexed Solr.")
    app._p_jar.sync()
