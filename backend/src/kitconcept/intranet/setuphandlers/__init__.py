from kitconcept.intranet.upgrades import remove_preview_image_behavior
from Products.CMFPlone.interfaces import INonInstallable
from zope.interface import implementer
import os
from collective.solr.interfaces import ISolrSchema
from plone.registry.interfaces import IRegistry
from zope.component import getUtility
from plone import api


@implementer(INonInstallable)
class HiddenProfiles:
    def getNonInstallableProfiles(self):
        """Hide uninstall profile from site-creation and quickinstaller."""
        return [
            "pas.plugins.authomatic:default",
            "pas.plugins.keycloakgroups:default",
            "pas.plugins.oidc:default",
            "kitconcept.intranet:restricted",
        ]


def post_install(setup_tool):
    remove_preview_image_behavior(setup_tool)


def post_solr_install(setup_tool):
    """Post install script for kitconcept.intranet:solr profile."""
    # Activate solr _if_ a solr host is configured
    if os.environ.get("COLLECTIVE_SOLR_HOST"):
        api.site.set_registry_record(
            "collective.solr.interfaces.ISolrSchema.active", True
        )
