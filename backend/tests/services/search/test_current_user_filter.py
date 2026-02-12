from collective.person.behaviors.user import IPloneUser
from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

import pytest
import transaction


@pytest.fixture(scope="class")
def portal(site):
    yield site


class TestCurrentUserFilter:
    def test_filter_by_current_user_organisational_unit(
        self, request_api_factory, portal
    ):
        username = "timo"
        password = "barcelona"

        with api.env.adopt_user(SITE_OWNER_NAME):
            # Create organisational units
            org_unit = api.content.create(
                portal, "Organisational Unit", id="kitconcept", title="kitconcept"
            )
            other_org_unit = api.content.create(
                portal, "Organisational Unit", id="other-org", title="Other Org"
            )

            # Create user
            portal.acl_users.userFolderAddUser(username, password, ["Manager"], [])

            # Create Person linked to org_unit
            person = api.content.create(
                portal,
                "Person",
                id=username,
                title="Timo",
                username=username,
            )
            IPloneUser(person).username = username
            api.relation.create(
                source=person,
                target=org_unit,
                relationship="organisational_unit_reference",
            )
            person.reindexObject()

            # Create content matching user's org unit
            matching_doc = api.content.create(
                portal, "Document", id="doc_matching", title="Matching Document"
            )
            api.relation.create(
                source=matching_doc,
                target=org_unit,
                relationship="organisational_unit_reference",
            )
            matching_doc.reindexObject()

            # Create content with different org unit
            other_doc = api.content.create(
                portal, "Document", id="doc_other", title="Other Document"
            )
            api.relation.create(
                source=other_doc,
                target=other_org_unit,
                relationship="organisational_unit_reference",
            )
            other_doc.reindexObject()

            # Create content with no org unit
            unrelated_doc = api.content.create(
                portal, "Document", id="doc_unrelated", title="Unrelated Document"
            )
            unrelated_doc.reindexObject()
            transaction.commit()

        api_session = request_api_factory()
        api_session.auth = (username, password)

        response = api_session.post(
            "@querystring-search",
            json={
                "query": [
                    {
                        "i": "organisational_unit_reference",
                        "o": "plone.app.querystring.operation.selection.currentUser",
                        "v": "",
                    }
                ],
            },
        )
        results = response.json()["items"]
        result_ids = [r["@id"] for r in results]
        assert matching_doc.absolute_url() in result_ids
        assert other_doc.absolute_url() not in result_ids
        assert unrelated_doc.absolute_url() not in result_ids

    def test_filter_by_current_user_location(self, request_api_factory, portal):
        username = "victor"
        password = "madrid"

        with api.env.adopt_user(SITE_OWNER_NAME):
            # Create locations
            location = api.content.create(portal, "Location", id="bonn", title="Bonn")
            other_location = api.content.create(
                portal, "Location", id="berlin", title="Berlin"
            )

            # Create user
            portal.acl_users.userFolderAddUser(username, password, ["Manager"], [])

            # Create Person linked to location
            person = api.content.create(
                portal,
                "Person",
                id=username,
                title="Victor",
                username=username,
            )
            IPloneUser(person).username = username
            api.relation.create(
                source=person,
                target=location,
                relationship="location_reference",
            )
            person.reindexObject()

            # Create content matching user's location
            matching_doc = api.content.create(
                portal, "Document", id="doc_bonn", title="Bonn Document"
            )
            api.relation.create(
                source=matching_doc,
                target=location,
                relationship="location_reference",
            )
            matching_doc.reindexObject()

            # Create content with different location
            other_doc = api.content.create(
                portal, "Document", id="doc_berlin", title="Berlin Document"
            )
            api.relation.create(
                source=other_doc,
                target=other_location,
                relationship="location_reference",
            )
            other_doc.reindexObject()
            transaction.commit()

        api_session = request_api_factory()
        api_session.auth = (username, password)

        response = api_session.post(
            "@querystring-search",
            json={
                "query": [
                    {
                        "i": "location_reference",
                        "o": "plone.app.querystring.operation.selection.currentUser",
                        "v": "",
                    }
                ],
            },
        )
        results = response.json()["items"]
        result_ids = [r["@id"] for r in results]
        assert matching_doc.absolute_url() in result_ids
        assert other_doc.absolute_url() not in result_ids
