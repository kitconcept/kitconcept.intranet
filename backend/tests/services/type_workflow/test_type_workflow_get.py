from plone import api

import pytest
import transaction


class TestTypeWorkflowGet:
    @pytest.fixture(autouse=True)
    def _setup(self, functional_portal, manager_request, anon_request, user_request):
        self.portal = functional_portal
        self.api_session = manager_request
        self.anon_api_session = anon_request
        self.user_request = user_request

    def test_anonymous_unauthorized(self):
        resp = self.anon_api_session.get("/@type-workflow/Document")
        assert resp.status_code == 401

    def test_editor_unauthorized(self):
        resp = self.user_request("editor").get("/@type-workflow/Document")
        assert resp.status_code == 401

    def test_site_administrator_allowed(self):
        resp = self.user_request("siteadmin").get("/@type-workflow/Document")
        assert resp.status_code == 200

    def test_unknown_type(self):
        resp = self.api_session.get("/@type-workflow/Unknown")
        assert resp.status_code == 404

    def test_too_many_params(self):
        resp = self.api_session.get("/@type-workflow/Document/foo")
        assert resp.status_code == 400

    def test_without_type(self):
        resp = self.api_session.get("/@type-workflow")
        assert resp.status_code == 200
        data = resp.json()
        assert data["default"] == "simple_intranet_workflow"
        assert "current" not in data
        assert len(data["workflows"]) > 1

    def test_workflows_payload(self):
        data = self.api_session.get("/@type-workflow/Document").json()
        wftool = api.portal.get_tool("portal_workflow")
        tokens = [wf["token"] for wf in data["workflows"]]
        assert sorted(tokens) == sorted(wftool.getWorkflowIds())
        wf = next(
            wf
            for wf in data["workflows"]
            if wf["token"] == "simple_intranet_workflow"  # noqa: S105
        )
        assert wf["initial_state"] == "private"
        assert {"pending", "private", "published"} <= {s["id"] for s in wf["states"]}
        assert all(s["title"] for s in wf["states"])

    def test_current_uses_default(self):
        data = self.api_session.get("/@type-workflow/Document").json()
        assert data["current"] == {
            "uses_default": True,
            "workflow": "simple_intranet_workflow",
        }

    def test_current_override(self):
        wftool = api.portal.get_tool("portal_workflow")
        wftool.setChainForPortalTypes(("Document",), ("simple_publication_workflow",))
        transaction.commit()
        data = self.api_session.get("/@type-workflow/Document").json()
        assert data["current"] == {
            "uses_default": False,
            "workflow": "simple_publication_workflow",
        }

    def test_current_no_workflow(self):
        wftool = api.portal.get_tool("portal_workflow")
        wftool.setChainForPortalTypes(("Document",), ())
        transaction.commit()
        resp = self.api_session.get("/@type-workflow/Document")
        assert resp.status_code == 200
        assert resp.json()["current"] == {"uses_default": False, "workflow": "[none]"}

    def test_empty_default_chain(self):
        wftool = api.portal.get_tool("portal_workflow")
        wftool.setChainForPortalTypes(("Document",), ("simple_intranet_workflow",))
        wftool.setDefaultChain("")
        transaction.commit()
        resp = self.api_session.get("/@type-workflow/Document")
        assert resp.status_code == 200
        assert resp.json()["default"] == "[none]"
