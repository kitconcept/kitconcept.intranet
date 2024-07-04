from plone.app.testing import FunctionalTesting
from plone.app.testing import IntegrationTesting
from plone.app.testing import PloneSandboxLayer
from plone.distribution.testing.layer import PloneDistributionFixture
from plone.testing.zope import WSGI_SERVER_FIXTURE


DEFAULT_ANSWERS = {
    "site_id": "plone",
    "title": "Intranet",
    "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA
    "default_language": "en",
    "portal_timezone": "Europe/Berlin",
    "setup_content": True,
}


class BaseFixture(PloneDistributionFixture):
    PACKAGE_NAME = "kitconcept.intranet"
    SITES = (("kitconcept-intranet", DEFAULT_ANSWERS),)
    _distribution_products = (
        ("plone.app.contenttypes", {"loadZCML": True}),
        ("plone.distribution", {"loadZCML": True}),
        ("plone.restapi", {"loadZCML": True}),
        ("plone.volto", {"loadZCML": True}),
        ("kitconcept.solr", {"loadZCML": True}),
        ("collective.person", {"loadZCML": True}),
    )


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
