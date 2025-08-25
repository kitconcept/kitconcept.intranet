from kitconcept.intranet.testing import FUNCTIONAL_TESTING
from plone import api
from plone.app.testing import TEST_USER_ID
from plone.app.testing import TEST_USER_NAME
from plone.app.testing import TEST_USER_PASSWORD
from plone.app.testing import login
from plone.app.testing import setRoles
from plone.restapi.testing import RelativeSession

import transaction
import unittest


class TestLCMService(unittest.TestCase):
    layer = FUNCTIONAL_TESTING

    def setUp(self):
        self.app = self.layer["app"]
        self.portal = self.layer["portal"]
        self.portal_url = self.portal.absolute_url()
        setRoles(self.portal, TEST_USER_ID, ["Manager"])
        login(self.portal, TEST_USER_NAME)

        api.content.create(self.portal, "Document", id="document", title="My Document")
        api.content.create(
            self.portal.document,
            "Document",
            id="nested_document",
            title="My Nested Document",
        )
        api.content.create(
            self.portal.document.nested_document,
            "Document",
            id="nested_nested_document",
            title="My Nested Nested Document",
        )

        self.api_session = RelativeSession(self.portal_url)
        self.api_session.headers.update({"Accept": "application/json"})
        self.api_session.auth = (TEST_USER_NAME, TEST_USER_PASSWORD)

        transaction.commit()

    def tearDown(self):
        self.api_session.close()

    def test_get_lcm_info_empty(self):
        response = self.api_session.get("/document/@lcm")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"responsible_person": {}})

    def test_get_lcm_info_empty_in_nested(self):
        response = self.api_session.get("/document/nested_document/@lcm")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"responsible_person": {}})

    def test_get_lcm_info_current(self):
        self.portal.document.responsible_person = "John Doe"

        transaction.commit()

        response = self.api_session.get("/document/@lcm")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "responsible_person": {
                    "url": f"{self.portal_url}/document",
                    "value": "John Doe",
                },
            },
        )

    def test_get_lcm_info_inherited(self):
        self.portal.document.responsible_person = "John Doe"

        transaction.commit()

        response = self.api_session.get("/document/nested_document/@lcm")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "responsible_person": {
                    "url": f"{self.portal_url}/document",
                    "value": "John Doe",
                },
            },
        )

    def test_get_lcm_info_inherited_we_stop_once_we_find_both(self):
        self.portal.document.responsible_person = "John Doe"
        self.portal.document.nested_document.responsible_person = "James T. Kirk"

        transaction.commit()

        response = self.api_session.get(
            "/document/nested_document/nested_nested_document/@lcm"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "responsible_person": {
                    "url": f"{self.portal_url}/document/nested_document",
                    "value": "James T. Kirk",
                },
            },
        )

    def test_get_lcm_info_inherited_ticket_1357(self):
        self.portal.document.responsible_person = "John Doe"
        self.portal.document.nested_document.responsible_person = "James T. Kirk"

        transaction.commit()

        response = self.api_session.get(
            "/document/nested_document/nested_nested_document/@lcm"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "responsible_person": {
                    "url": f"{self.portal_url}/document/nested_document",
                    "value": "James T. Kirk",
                },
            },
        )
