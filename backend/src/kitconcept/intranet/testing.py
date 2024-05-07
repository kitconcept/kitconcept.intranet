from plone.app.robotframework.testing import REMOTE_LIBRARY_BUNDLE_FIXTURE
from plone.app.testing import FunctionalTesting
from plone.app.testing import IntegrationTesting
from plone.app.testing import PloneSandboxLayer
from plone.distribution.testing.layer import PloneDistributionFixture
from plone.testing.zope import WSGI_SERVER_FIXTURE

import kitconcept.intranet  # noQA


DEFAULT_ANSWERS = {
    "site_id": "plone",
    "title": "My Site",
    "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",
    "default_language": "en",
    "portal_timezone": "Europe/Berlin",
    "setup_content": True,
}


class BaseFixture(PloneDistributionFixture):
    PACKAGE_NAME = "kitconcept.intranet"

    SITES = (("intranet", DEFAULT_ANSWERS),)


BASE_FIXTURE = BaseFixture()


class Layer(PloneSandboxLayer):
    defaultBases = (BASE_FIXTURE,)

    def setUpZope(self, app, configurationContext):
        # Load any other ZCML that is required for your tests.
        # The z3c.autoinclude feature is disabled in the Plone fixture base
        # layer.
        import plone.restapi

        self.loadZCML(package=plone.restapi)


FIXTURE = Layer()

INTEGRATION_TESTING = IntegrationTesting(
    bases=(FIXTURE,),
    name="Kitconcept.IntranetLayer:IntegrationTesting",
)


FUNCTIONAL_TESTING = FunctionalTesting(
    bases=(FIXTURE, WSGI_SERVER_FIXTURE),
    name="Kitconcept.IntranetLayer:FunctionalTesting",
)


ACCEPTANCE_TESTING = FunctionalTesting(
    bases=(
        FIXTURE,
        REMOTE_LIBRARY_BUNDLE_FIXTURE,
        WSGI_SERVER_FIXTURE,
    ),
    name="Kitconcept.IntranetLayer:AcceptanceTesting",
)
