from kitconcept.intranet.upgrades import remove_preview_image_behavior
from kitconcept.intranet.upgrades import set_dashboard_layout
from Products.CMFPlone.interfaces import INonInstallable
from zope.interface import implementer


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
    set_dashboard_layout(setup_tool)
