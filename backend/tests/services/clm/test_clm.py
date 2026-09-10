from collective.person.behaviors.user import IPloneUser
from plone import api

import pytest
import transaction


class TestCLMService:
    @pytest.fixture(autouse=True)
    def _setup(self, functional_portal, manager_request):
        self.portal = functional_portal
        self.portal_url = functional_portal.absolute_url()
        self.api_session = manager_request

    def test_get_clm_info_empty(self):
        response = self.api_session.get("/document/@clm")

        assert response.status_code == 200
        assert response.json() == {"responsible_person": {}}

    def test_get_clm_info_empty_in_nested(self):
        response = self.api_session.get("/document/nested_document/@clm")

        assert response.status_code == 200
        assert response.json() == {"responsible_person": {}}

    def test_get_clm_info_with_multiple_authors(self):
        with api.env.adopt_roles(["Manager"]):
            self.portal.acl_users.userFolderAddUser("jane", "secret", [], [])
            self.portal.acl_users.userFolderAddUser("john", "secret", [], [])
            jane = api.content.create(
                self.portal,
                "Person",
                id="jane-doe",
                first_name="Jane",
                last_name="Doe",
                username="jane",
            )
            IPloneUser(jane).username = "jane"
            john = api.content.create(
                self.portal,
                "Person",
                id="john-doe",
                first_name="John",
                last_name="Doe",
                username="john",
            )
            IPloneUser(john).username = "john"
            self.portal.document.authors = [jane.UID(), john.UID()]
        transaction.commit()

        response = self.api_session.get("/document/@clm")

        assert response.status_code == 200
        assert response.json() == {
            "authors": [
                {
                    "person_url": f"{self.portal_url}/jane-doe",
                    "title": "Jane Doe",
                    "username": "jane",
                    "value": jane.UID(),
                },
                {
                    "person_url": f"{self.portal_url}/john-doe",
                    "title": "John Doe",
                    "username": "john",
                    "value": john.UID(),
                },
            ],
            "responsible_person": {},
        }

    def test_get_clm_info_current(self):
        self.portal.document.responsible_person = "John Doe"
        transaction.commit()

        response = self.api_session.get("/document/@clm")

        assert response.status_code == 200
        assert response.json() == {
            "responsible_person": {
                "url": f"{self.portal_url}/document",
                "value": "John Doe",
            },
        }

    def test_get_clm_info_inherited(self):
        self.portal.document.responsible_person = "John Doe"
        transaction.commit()

        response = self.api_session.get("/document/nested_document/@clm")

        assert response.status_code == 200
        assert response.json() == {
            "responsible_person": {
                "url": f"{self.portal_url}/document",
                "value": "John Doe",
            },
        }

    def test_get_clm_info_inherited_we_stop_once_we_find_both(self):
        self.portal.document.responsible_person = "John Doe"
        self.portal.document.nested_document.responsible_person = "James T. Kirk"
        transaction.commit()

        response = self.api_session.get(
            "/document/nested_document/nested_nested_document/@clm"
        )

        assert response.status_code == 200
        assert response.json() == {
            "responsible_person": {
                "url": f"{self.portal_url}/document/nested_document",
                "value": "James T. Kirk",
            },
        }

    def test_get_clm_info_inherited_ticket_1357(self):
        self.portal.document.responsible_person = "John Doe"
        self.portal.document.nested_document.responsible_person = "James T. Kirk"
        transaction.commit()

        response = self.api_session.get(
            "/document/nested_document/nested_nested_document/@clm"
        )

        assert response.status_code == 200
        assert response.json() == {
            "responsible_person": {
                "url": f"{self.portal_url}/document/nested_document",
                "value": "James T. Kirk",
            },
        }
