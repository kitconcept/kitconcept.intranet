from collective.solr.interfaces import ISolrSchema
from kitconcept.intranet.upgrades import remove_preview_image_behavior
from plone import api
from plone.registry.interfaces import IRegistry
from Products.CMFPlone.interfaces import INonInstallable
from zope.component import getUtility
from zope.interface import implementer

import os


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
