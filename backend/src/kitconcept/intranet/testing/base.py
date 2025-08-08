from kitconcept.core.testing.layers import kitconceptDistributionFixture
from kitconcept.intranet.testing.logo import TEST_LOGO
from plone.app.testing import FunctionalTesting
from plone.app.testing import IntegrationTesting
from plone.app.testing import PloneSandboxLayer
from plone.app.testing.interfaces import SITE_OWNER_NAME
from plone.app.testing.interfaces import SITE_OWNER_PASSWORD
from plone.app.testing.interfaces import TEST_USER_ID
from plone.app.testing.interfaces import TEST_USER_NAME
from plone.app.testing.interfaces import TEST_USER_PASSWORD
from plone.app.testing.interfaces import TEST_USER_ROLES
from plone.testing import zope
from plone.testing.zope import WSGI_SERVER_FIXTURE
from zope.globalrequest import setRequest


DEFAULT_ANSWERS = {
    "site_id": "plone",
    "title": "Intranet",
    "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
    "available_languages": ["en"],
    "portal_timezone": "Europe/Berlin",
    "site_logo": TEST_LOGO,
    "workflow": "public",
    "setup_content": False,
    "authentication": {"provider": "internal"},
}


class BaseFixture(kitconceptDistributionFixture):
    PACKAGE_NAME = "kitconcept.intranet"
    sites = (("kitconcept-intranet", DEFAULT_ANSWERS),)
    internal_packages: tuple[str, ...] = (
        "plone.restapi",
        "plone.volto",
        "kitconcept.core",
        "kitconcept.intranet",
    )

    def setUpDefaultContent(self, app):
        """Create a Plone site using plone.distribution."""
        from kitconcept.core.factory import add_site

        # Create the owner user and "log in" so that the site object gets
        # the right ownership information
        app["acl_users"].userFolderAddUser(
            SITE_OWNER_NAME, SITE_OWNER_PASSWORD, ["Manager"], []
        )

        setRequest(app.REQUEST)
        zope.login(app["acl_users"], SITE_OWNER_NAME)
        sites = self.sites
        for distribution_name, answers in sites:
            site_id = answers["site_id"]
            # Create Plone site
            add_site(
                app,
                extension_ids=self.extensionProfiles,
                distribution=distribution_name,
                **answers,
            )

            # Create the test user. (Plone)PAS does not have an API to create a
            # user with different userid and login name, so we call the plugin
            # directly.
            pas = app[site_id]["acl_users"]
            pas.source_users.addUser(TEST_USER_ID, TEST_USER_NAME, TEST_USER_PASSWORD)
            for role in TEST_USER_ROLES:
                pas.portal_role_manager.doAssignRoleToPrincipal(TEST_USER_ID, role)

        # Log out again
        zope.logout()
        setRequest(None)


BASE_FIXTURE = BaseFixture()


class Layer(PloneSandboxLayer):
    defaultBases = (BASE_FIXTURE,)


FIXTURE = Layer()


INTEGRATION_TESTING = IntegrationTesting(
    bases=(FIXTURE,),
    name="Kitconcept.IntranetLayer:IntegrationTesting",
)


FUNCTIONAL_TESTING = FunctionalTesting(
    bases=(FIXTURE, WSGI_SERVER_FIXTURE),
    name="Kitconcept.IntranetLayer:FunctionalTesting",
)
