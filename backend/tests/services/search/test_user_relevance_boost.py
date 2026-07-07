from collective.person.behaviors.user import IPloneUser
from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

import pytest
import transaction


@pytest.fixture(scope="class")
def credentials() -> tuple[str, str]:
    return ("timo", "barcelona")


@pytest.fixture(scope="class")
def portal(functional_portal, credentials):
    portal = functional_portal
    username, password = credentials
    with api.env.adopt_user(SITE_OWNER_NAME):
        # Create organisational unit
        org_unit = api.content.create(
            portal, "Organisational Unit", id="kitconcept", title="kitconcept"
        )

        # Create location
        location = api.content.create(portal, "Location", id="bonn", title="Bonn")

        # Create user
        portal.acl_users.userFolderAddUser(username, password, ["Manager"], [])

        # Create Person
        person = api.content.create(
            portal,
            "Person",
            id=username,
            title="Timo",
            username=username,
        )
        IPloneUser(person).username = "timo"
        person.organisational_unit_reference = [org_unit.UID()]
        person.location_reference = [location.UID()]
        person.reindexObject()

        # Create some content
        unrelated_doc = api.content.create(
            portal, "Document", id="doc_unrelated", title="Document"
        )
        unrelated_doc.reindexObject()
        kitconcept_doc = api.content.create(
            portal, "Document", id="doc_kitconcept", title="Document"
        )
        kitconcept_doc.organisational_unit_reference = [org_unit.UID()]
        kitconcept_doc.reindexObject()
        bonn_doc = api.content.create(
            portal, "Document", id="doc_bonn", title="Document"
        )
        bonn_doc.location_reference = [location.UID()]
        bonn_doc.reindexObject()
        kitconcept_bonn_doc = api.content.create(
            portal, "Document", id="doc_kitconcept_bonn", title="Document"
        )
        kitconcept_bonn_doc.organisational_unit_reference = [org_unit.UID()]
        kitconcept_bonn_doc.location_reference = [location.UID()]
        kitconcept_bonn_doc.reindexObject()
        transaction.commit()
    yield portal


@pytest.mark.slow
@pytest.mark.solr
class TestUserRelevanceBoost:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, request_factory, credentials):
        self.portal = portal
        self.api_session = request_factory()
        self.api_session.auth = credentials
        self.urls = [
            portal["doc_kitconcept_bonn"].absolute_url(),
            portal["doc_kitconcept"].absolute_url(),
            portal["doc_bonn"].absolute_url(),
            portal["doc_unrelated"].absolute_url(),
        ]

    def test_sort_on_user_relevance(self):
        session = self.api_session

        response = session.post(
            "@querystring-search",
            json={
                "query": [
                    {
                        "i": "SearchableText",
                        "o": "plone.app.querystring.operation.string.contains",
                        "v": "document",
                    }
                ],
                "sort_on": "userRelevance",
            },
        )
        results = response.json()["items"]
        assert len(results) >= 4
        assert [r["@id"] for r in results[:4]] == self.urls
