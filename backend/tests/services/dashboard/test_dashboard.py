from collective.person.behaviors.user import IPloneUser
from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME
from plone.dexterity.interfaces import IDexterityFTI
from zope.component import getUtility
from zope.component import hooks

import pytest
import transaction


PASSWORD = "secret12345"  # noqa: S105


@pytest.fixture()
def portal(functional_portal):
    with api.env.adopt_user(SITE_OWNER_NAME):
        acl_users = functional_portal.acl_users
        acl_users.userFolderAddUser("jdoe", PASSWORD, ["Member"], [])
        acl_users.userFolderAddUser("jane", PASSWORD, ["Member"], [])
        acl_users.userFolderAddUser("siteadmin", PASSWORD, ["Site Administrator"], [])
        person = api.content.create(
            functional_portal, "Person", id="jdoe", first_name="John"
        )
        IPloneUser(person).username = "jdoe"
        api.content.transition(person, "publish")
    transaction.commit()
    yield functional_portal


@pytest.fixture()
def session_for(request_factory):
    def func(username):
        session = request_factory()
        session.auth = (username, PASSWORD)
        return session

    return func


class TestDashboard:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, session_for):
        self.portal = portal
        self.session_for = session_for

    def test_get_default_blocks_as_owner(self):
        resp = self.session_for("jdoe").get("/jdoe/@dashboard")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["blocks_layout"]["items"]) == 1
        block_id = data["blocks_layout"]["items"][0]
        assert data["blocks"][block_id]["@type"] == "title"

    def test_get_resolves_uids_in_default_blocks(self, monkeypatch):
        """Links in the admin's default layout are turned into URLs."""
        with api.env.adopt_user(SITE_OWNER_NAME):
            doc = api.content.create(self.portal, "Document", id="target")
            api.content.transition(doc, "publish")
        transaction.commit()
        resolveuid = f"resolveuid/{doc.UID()}"
        # Don't PATCH @types: the generated schema stays changed in memory
        # across tests. Patch the field default instead; monkeypatch undoes it.
        with hooks.site(self.portal):
            schema = getUtility(IDexterityFTI, name="Dashboard").lookupSchema()
        field = schema["blocks"]
        monkeypatch.setattr(
            field, "default", {"img": {"@type": "image", "url": resolveuid}}
        )

        data = self.session_for("jdoe").get("/jdoe/@dashboard").json()
        assert data["blocks"]["img"]["url"] == doc.absolute_url()
        # The type's own default must stay untouched
        assert field.default["img"]["url"] == resolveuid

    def test_get_as_site_administrator(self):
        resp = self.session_for("siteadmin").get("/jdoe/@dashboard")
        assert resp.status_code == 401

    def test_get_as_other_user(self):
        resp = self.session_for("jane").get("/jdoe/@dashboard")
        assert resp.status_code == 401

    def test_post_creates_private_dashboard_owned_by_user(self):
        resp = self.session_for("jdoe").post("/jdoe/@dashboard")
        assert resp.status_code == 201
        assert resp.json()["@id"].endswith("/jdoe/dashboard")

        transaction.begin()
        dashboard = self.portal["jdoe"]["dashboard"]
        assert dashboard.portal_type == "Dashboard"
        assert api.content.get_state(dashboard) == "private"
        assert "Owner" in api.user.get_roles(username="jdoe", obj=dashboard)

    def test_post_twice_keeps_existing_dashboard(self):
        session = self.session_for("jdoe")
        assert session.post("/jdoe/@dashboard").status_code == 201
        assert session.post("/jdoe/@dashboard").status_code == 201
        transaction.begin()
        assert self.portal["jdoe"].objectIds() == ["dashboard"]

    def test_post_as_other_user(self):
        resp = self.session_for("jane").post("/jdoe/@dashboard")
        assert resp.status_code == 401

    def test_dashboard_visibility(self):
        self.session_for("jdoe").post("/jdoe/@dashboard")
        assert self.session_for("jdoe").get("/jdoe/dashboard").status_code == 200
        assert self.session_for("siteadmin").get("/jdoe/dashboard").status_code == 200
        assert self.session_for("jane").get("/jdoe/dashboard").status_code == 401

    def test_person_creator_cannot_see_dashboard(self):
        """The Owner local role of the Person creator must not be inherited."""
        with api.env.adopt_user(SITE_OWNER_NAME):
            self.portal["jdoe"].manage_setLocalRoles("jane", ["Owner"])
        transaction.commit()
        self.session_for("jdoe").post("/jdoe/@dashboard")
        assert self.session_for("jane").get("/jdoe/dashboard").status_code == 401

    def test_anonymous_on_person_without_username(self, request_factory):
        with api.env.adopt_user(SITE_OWNER_NAME):
            person = api.content.create(self.portal, "Person", id="nouser")
            api.content.transition(person, "publish")
        transaction.commit()
        anonymous = request_factory()
        assert anonymous.get("/nouser/@dashboard").status_code == 401
        assert anonymous.post("/nouser/@dashboard").status_code == 401
        transaction.begin()
        assert "dashboard" not in self.portal["nouser"]

    def test_owner_can_edit_dashboard(self):
        session = self.session_for("jdoe")
        session.post("/jdoe/@dashboard")
        resp = session.patch("/jdoe/dashboard", json={"title": "My dashboard"})
        assert resp.status_code == 204
