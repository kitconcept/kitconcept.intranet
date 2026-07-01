from kitconcept.core.testing.layers import kitconceptDistributionFixture
from kitconcept.intranet.testing.logo import TEST_LOGO
from plone.app.testing import FunctionalTesting
from plone.app.testing import IntegrationTesting
from plone.app.testing import PloneSandboxLayer
from plone.testing.zope import WSGI_SERVER_FIXTURE

import transaction


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

    def setUp(self):
        from plone.volto import upgrades

        self._orig_reindex_block_types = upgrades.reindex_block_types

        def reindex_block_types_without_commit(context):
            catalog = context.portal_catalog
            brains = catalog(object_provides="plone.restapi.behaviors.IBlocks")
            total = len(brains)
            for index, brain in enumerate(brains):
                obj = brain.getObject()
                obj.reindexObject(idxs=["block_types"], update_metadata=1)
                if index % 250 == 0:
                    transaction.savepoint(optimistic=True)
            transaction.savepoint(optimistic=True)

        upgrades.reindex_block_types = reindex_block_types_without_commit
        super().setUp()

    def tearDown(self):
        from plone.volto import upgrades

        upgrades.reindex_block_types = self._orig_reindex_block_types
        del self._orig_reindex_block_types
        super().tearDown()


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
