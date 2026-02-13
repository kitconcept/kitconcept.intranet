from collective.person.behaviors.user import IPloneUser
from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

import pytest
import transaction


@pytest.fixture(scope="class")
def portal(site):
    yield site


@pytest.fixture()
def user_with_person(portal, request_api_factory):
    """Create a user with an associated Person and return a helper object."""

    class UserWithPerson:
        def __init__(self, username, password, title):
            self.username = username
            self.password = password
            with api.env.adopt_user(SITE_OWNER_NAME):
                portal.acl_users.userFolderAddUser(username, password, ["Manager"], [])
                self.person = api.content.create(
                    portal,
                    "Person",
                    id=username,
                    title=title,
                    username=username,
                )
                IPloneUser(self.person).username = username

        def add_relation(self, target, relationship):
            with api.env.adopt_user(SITE_OWNER_NAME):
                api.relation.create(
                    source=self.person,
                    target=target,
                    relationship=relationship,
                )
                self.person.reindexObject()

        @property
        def api_session(self):
            session = request_api_factory()
            session.auth = (self.username, self.password)
            return session

    return UserWithPerson


@pytest.fixture()
def create_content(portal):
    """Create a Document with optional relations."""

    def factory(id, title, relations=None):
        with api.env.adopt_user(SITE_OWNER_NAME):
            doc = api.content.create(portal, "Document", id=id, title=title)
            for target, relationship in relations or []:
                api.relation.create(
                    source=doc,
                    target=target,
                    relationship=relationship,
                )
            doc.reindexObject()
        return doc

    return factory


class TestCurrentUserFilter:
    def test_filter_by_current_user_organisational_unit(
        self, user_with_person, create_content, portal
    ):
        with api.env.adopt_user(SITE_OWNER_NAME):
            org_unit = api.content.create(
                portal, "Organisational Unit", id="kitconcept", title="kitconcept"
            )
            other_org_unit = api.content.create(
                portal, "Organisational Unit", id="other-org", title="Other Org"
            )

        user = user_with_person("timo", "barcelona", "Timo")
        user.add_relation(org_unit, "organisational_unit_reference")

        matching_doc = create_content(
            "doc_matching",
            "Matching Document",
            [(org_unit, "organisational_unit_reference")],
        )
        other_doc = create_content(
            "doc_other",
            "Other Document",
            [(other_org_unit, "organisational_unit_reference")],
        )
        unrelated_doc = create_content("doc_unrelated", "Unrelated Document")
        transaction.commit()

        response = user.api_session.post(
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

    def test_filter_by_current_user_location(
        self, user_with_person, create_content, portal
    ):
        with api.env.adopt_user(SITE_OWNER_NAME):
            location = api.content.create(portal, "Location", id="bonn", title="Bonn")
            other_location = api.content.create(
                portal, "Location", id="berlin", title="Berlin"
            )

        user = user_with_person("victor", "madrid", "Victor")
        user.add_relation(location, "location_reference")

        matching_doc = create_content(
            "doc_bonn", "Bonn Document", [(location, "location_reference")]
        )
        other_doc = create_content(
            "doc_berlin", "Berlin Document", [(other_location, "location_reference")]
        )
        transaction.commit()

        response = user.api_session.post(
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
