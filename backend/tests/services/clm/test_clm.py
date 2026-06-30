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
