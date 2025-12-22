from collective.person.behaviors.user import IPloneUser
from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

import pytest
import transaction


@pytest.fixture(scope="class")
def portal(site):
    yield site


class TestUserRelevanceBoost:
    def test_sort_on_user_relevance(self, request_api_factory, portal):
        username = "timo"
        password = "barcelona"

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
            api.relation.create(
                source=person,
                target=org_unit,
                relationship="organisational_unit_reference",
            )
            api.relation.create(
                source=person, target=location, relationship="location_reference"
            )
            person.reindexObject()

            # Create some content
            unrelated_doc = api.content.create(
                portal, "Document", id="doc_unrelated", title="Document"
            )
            unrelated_doc.reindexObject()
            kitconcept_doc = api.content.create(
                portal, "Document", id="doc_kitconcept", title="Document"
            )
            api.relation.create(
                source=kitconcept_doc,
                target=org_unit,
                relationship="organisational_unit_reference",
            )
            kitconcept_doc.reindexObject()
            bonn_doc = api.content.create(
                portal, "Document", id="doc_bonn", title="Document"
            )
            api.relation.create(
                source=bonn_doc, target=location, relationship="location_reference"
            )
            bonn_doc.reindexObject()
            kitconcept_bonn_doc = api.content.create(
                portal, "Document", id="doc_kitconcept_bonn", title="Document"
            )
            api.relation.create(
                source=kitconcept_bonn_doc,
                target=org_unit,
                relationship="organisational_unit_reference",
            )
            api.relation.create(
                source=kitconcept_bonn_doc,
                target=location,
                relationship="location_reference",
            )
            kitconcept_bonn_doc.reindexObject()
            transaction.commit()

        self.api_session = request_api_factory()
        self.api_session.auth = (username, password)

        response = self.api_session.post(
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
        assert [r["@id"] for r in results[:4]] == [
            kitconcept_doc.absolute_url(),
            kitconcept_bonn_doc.absolute_url(),
             bonn_doc.absolute_url(),
             unrelated_doc.absolute_url(),
        ]
