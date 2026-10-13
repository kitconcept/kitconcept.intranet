from plone import api

import pytest


DEMO_USERS = [
    "a.becker",
    "a.demir",
    "b.yilmaz",
    "c.beck",
    "c.nguyen",
    "d.schmidt",
    "e.roth",
    "f.meier",
    "j.halmbach",
    "j.seidel",
    "l.brandt",
    "m.berger",
    "m.engelhardt",
    "n.paulsen",
    "p.maier",
    "s.lehner",
    "t.werner",
]
SITE_ADMINISTRATORS = ["a.becker", "c.nguyen", "m.berger"]


@pytest.fixture(scope="class")
def answers():
    return {
        "site_id": "demousers",
        "title": "Intranet",
        "description": "Intranet with example content.",
        "workflow": "public",
        "available_languages": ["de"],
        "portal_timezone": "Europe/Berlin",
        "site_logo": None,
        "setup_content": True,
        "authentication": {"provider": "internal"},
    }


@pytest.mark.slow
class TestExampleContentUsers:
    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.site = portal

    @pytest.mark.parametrize("username", DEMO_USERS)
    def test_demo_user_password(self, username):
        source_users = self.site.acl_users.source_users
        assert source_users.authenticateCredentials({
            "login": username,
            "password": "password",
        }) == (username, username)

    @pytest.mark.parametrize("username", SITE_ADMINISTRATORS)
    def test_site_administrators(self, username):
        roles = api.user.get_roles(username=username)
        assert "Site Administrator" in roles
