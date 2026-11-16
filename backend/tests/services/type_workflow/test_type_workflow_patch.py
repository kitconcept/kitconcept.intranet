from plone import api

import pytest
import transaction


DEFAULT_WF = "simple_intranet_workflow"
OTHER_WF = "simple_publication_workflow"
ONE_STATE_WF = "one_state_workflow"


class TestTypeWorkflowPatchValidation:
    @pytest.fixture(autouse=True)
    def _setup(
        self, functional_portal, manager_request, anon_request, user_request, chain_for
    ):
        self.portal = functional_portal
        self.api_session = manager_request
        self.anon_api_session = anon_request
        self.user_request = user_request
        self.chain_for = chain_for

    def test_anonymous_unauthorized(self):
        resp = self.anon_api_session.patch(
            "/@type-workflow/Document", json={"new": OTHER_WF}
        )
        assert resp.status_code == 401
        assert self.chain_for("Document") == (DEFAULT_WF,)

    def test_editor_unauthorized(self):
        resp = self.user_request("editor").patch(
            "/@type-workflow/Document", json={"new": OTHER_WF}
        )
        assert resp.status_code == 401
        transaction.begin()
        assert self.chain_for("Document") == (DEFAULT_WF,)

    def test_site_administrator_allowed(self):
        resp = self.user_request("siteadmin").patch(
            "/@type-workflow/Document", json={"new": OTHER_WF}
        )
        assert resp.status_code == 200
        transaction.begin()
        assert self.chain_for("Document") == (OTHER_WF,)

    def test_without_type(self):
        resp = self.api_session.patch("/@type-workflow", json={"new": OTHER_WF})
        assert resp.status_code == 400

    def test_unknown_type(self):
        resp = self.api_session.patch("/@type-workflow/Unknown", json={"new": OTHER_WF})
        assert resp.status_code == 404

    @pytest.mark.parametrize("body", [{}, {"new": ""}, {"new": None}])
    def test_missing_new(self, body):
        resp = self.api_session.patch("/@type-workflow/Document", json=body)
        assert resp.status_code == 400
        assert "new" in resp.json()["message"]

    def test_unknown_workflow(self):
        resp = self.api_session.patch(
            "/@type-workflow/Document", json={"new": "does_not_exist"}
        )
        assert resp.status_code == 400
        assert "Unknown workflow" in resp.json()["message"]
        transaction.begin()
        assert self.chain_for("Document") == (DEFAULT_WF,)

    def test_nothing_changed(self):
        resp = self.api_session.patch(
            "/@type-workflow/Document", json={"new": DEFAULT_WF}
        )
        assert resp.status_code == 400
        assert resp.json()["message"] == "Nothing changed."

    def test_stale_old(self):
        resp = self.api_session.patch(
            "/@type-workflow/Document",
            json={"old": OTHER_WF, "new": ONE_STATE_WF},
        )
        assert resp.status_code == 400
        assert "changed in the meantime" in resp.json()["message"]
        transaction.begin()
        assert self.chain_for("Document") == (DEFAULT_WF,)

    def test_matching_old(self):
        resp = self.api_session.patch(
            "/@type-workflow/Document",
            json={"old": DEFAULT_WF, "new": OTHER_WF},
        )
        assert resp.status_code == 200
        assert resp.json() == {"workflow": OTHER_WF}

    @pytest.mark.parametrize("state_map", [[], "published", 1])
    def test_state_map_not_an_object(self, state_map):
        resp = self.api_session.patch(
            "/@type-workflow/Document",
            json={"new": OTHER_WF, "stateMap": state_map},
        )
        assert resp.status_code == 400
        assert "stateMap" in resp.json()["message"]

    def test_state_map_unknown_target_state(self):
        resp = self.api_session.patch(
            "/@type-workflow/Document",
            json={"new": ONE_STATE_WF, "stateMap": {"private": "private"}},
        )
        assert resp.status_code == 400
        assert "Unknown state" in resp.json()["message"]
        transaction.begin()
        assert self.chain_for("Document") == (DEFAULT_WF,)

    def test_state_map_ignored_for_no_workflow(self):
        resp = self.api_session.patch(
            "/@type-workflow/Document",
            json={"new": "[none]", "stateMap": {"private": "does_not_exist"}},
        )
        assert resp.status_code == 200


class TestTypeWorkflowPatchRemap:
    @pytest.fixture(autouse=True)
    def _setup(
        self,
        functional_portal,
        manager_request,
        anon_request,
        chain_for,
        review_state,
    ):
        self.portal = functional_portal
        self.api_session = manager_request
        self.anon_api_session = anon_request
        self.chain_for = chain_for
        self.review_state = review_state

    def patch(self, portal_type="Document", **body):
        resp = self.api_session.patch(f"/@type-workflow/{portal_type}", json=body)
        transaction.begin()
        return resp

    def test_changes_only_given_type(self):
        resp = self.patch(new=OTHER_WF)
        assert resp.status_code == 200
        assert self.chain_for("Document") == (OTHER_WF,)
        assert self.chain_for("News Item") == (DEFAULT_WF,)
        assert self.review_state("/news") == "published"
        wftool = api.portal.get_tool("portal_workflow")
        assert wftool.getDefaultChain() == (DEFAULT_WF,)

    def test_state_map_applied(self):
        resp = self.patch(
            new=OTHER_WF,
            stateMap={"published": "published", "private": "pending"},
        )
        assert resp.status_code == 200
        assert self.review_state("/published-doc") == "published"
        assert self.review_state("/private-doc") == "pending"

    def test_unmapped_states_get_initial_state(self):
        resp = self.patch(new=OTHER_WF, stateMap={})
        assert resp.status_code == 200
        initial = api.portal.get_tool("portal_workflow")[OTHER_WF].initial_state
        assert self.review_state("/published-doc") == initial
        assert self.review_state("/private-doc") == initial

    def test_missing_state_map_gets_initial_state(self):
        resp = self.patch(new=OTHER_WF)
        assert resp.status_code == 200
        initial = api.portal.get_tool("portal_workflow")[OTHER_WF].initial_state
        assert self.review_state("/published-doc") == initial

    def test_permissions_follow_mapped_state(self):
        assert self.anon_api_session.get("/published-doc").status_code == 200
        assert self.anon_api_session.get("/private-doc").status_code == 401

        resp = self.patch(
            new=OTHER_WF,
            stateMap={"published": "private", "private": "published"},
        )
        assert resp.status_code == 200
        assert self.anon_api_session.get("/published-doc").status_code == 401
        assert self.anon_api_session.get("/private-doc").status_code == 200

    def test_catalog_reindexed(self):
        self.patch(new=OTHER_WF, stateMap={"private": "pending"})
        catalog = api.portal.get_tool("portal_catalog")
        brains = catalog.unrestrictedSearchResults(portal_type="Document")
        states = {brain.getId: brain.review_state for brain in brains}
        assert states["private-doc"] == "pending"

    def test_set_no_workflow(self):
        resp = self.patch(new="[none]")
        assert resp.status_code == 200
        assert resp.json() == {"workflow": "[none]"}
        assert self.chain_for("Document") == ()
        data = self.api_session.get("/@type-workflow/Document").json()
        assert data["current"]["workflow"] == "[none]"

    def test_from_no_workflow(self):
        assert self.patch(new="[none]").status_code == 200
        resp = self.patch(old="[none]", new=OTHER_WF, stateMap={"[none]": "published"})
        assert resp.status_code == 200
        assert self.chain_for("Document") == (OTHER_WF,)
        assert self.review_state("/published-doc") == "published"
        assert self.review_state("/private-doc") == "published"

    def test_back_to_default_workflow(self):
        assert self.patch(new=OTHER_WF, stateMap={"published": "published"}).ok
        resp = self.patch(
            new=DEFAULT_WF,
            stateMap={"published": "published", "private": "private"},
        )
        assert resp.status_code == 200
        assert self.chain_for("Document") == (DEFAULT_WF,)
        assert self.review_state("/published-doc") == "published"
        data = self.api_session.get("/@type-workflow/Document").json()
        assert data["current"]["workflow"] == DEFAULT_WF
