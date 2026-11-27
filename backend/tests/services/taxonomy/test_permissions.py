from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

import pytest
import transaction


PASSWORD = "secret-12345"  # noqa: S105

PAYLOAD = {
    "taxonomy": "new-taxonomy",
    "field_title": "New taxonomy",
    "default_language": "en",
}


class TestTaxonomyPermissions:
    @pytest.fixture(autouse=True)
    def _setup(self, functional, request_factory):
        self.portal = functional["portal"]
        self.request_factory = request_factory
        with api.env.adopt_user(SITE_OWNER_NAME):
            for role in ("Site Administrator", "Editor", "Member"):
                username = role.lower().replace(" ", "")
                api.user.create(
                    email=f"{username}@example.org",
                    username=username,
                    password=PASSWORD,
                    roles=(role,),
                )
        transaction.commit()

    def _session(self, role):
        if role == "Manager":
            return self.request_factory(role=role)
        username = role.lower().replace(" ", "")
        return self.request_factory(basic_auth=(username, PASSWORD))

    @pytest.mark.parametrize("role", ["Manager", "Site Administrator"])
    def test_create_update_delete(self, role):
        """Managers and Site Administrators manage taxonomies."""
        session = self._session(role)
        response = session.post("/@taxonomy", json=PAYLOAD)
        assert response.status_code == 201
        taxonomy = response.json()["@id"].rsplit("/", 1)[-1]
        response = session.patch(
            f"/@taxonomy/{taxonomy}",
            json={
                "taxonomy": taxonomy,
                "default_language": "en",
                "tree": [{"key": "a", "title": "A", "translations": {"en": "A"}}],
            },
        )
        assert response.status_code in (200, 204)
        response = session.delete(f"/@taxonomy/{taxonomy}")
        assert response.status_code in (200, 204)

    @pytest.mark.parametrize("role", ["Editor", "Member"])
    def test_other_roles_are_refused(self, role):
        session = self._session(role)
        response = session.post("/@taxonomy", json=PAYLOAD)
        assert response.status_code in (401, 403)
