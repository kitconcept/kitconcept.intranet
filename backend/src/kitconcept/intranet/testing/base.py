from kitconcept.core.testing.layers import kitconceptDistributionFixture
from kitconcept.intranet.testing.logo import TEST_LOGO
from plone.app.testing import FunctionalTesting
from plone.app.testing import IntegrationTesting
from plone.app.testing import PloneSandboxLayer
from plone.testing.zope import WSGI_SERVER_FIXTURE



DEFAULT_ANSWERS = {
    "site_id": "plone",
    "title": "Intranet",
    "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
    "available_languages": ["en"],
    "portal_timezone": "Europe/Berlin",
    "site_logo": TEST_LOGO,
    "workflow": "public",
    "setup_content": False,
    "setup_solr": False,
    "authentication": {"provider": "internal"},
}


class BaseFixture(kitconceptDistributionFixture):
    PACKAGE_NAME = "kitconcept.intranet"
    sites = (("kitconcept-intranet", DEFAULT_ANSWERS),)
    internal_packages: tuple[str, ...] = ("kitconcept.intranet",)


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
