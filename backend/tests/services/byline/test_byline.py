from io import BytesIO
from PIL import Image
from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

import pytest
import transaction


def _png():
    data = BytesIO()
    Image.new("RGB", (10, 10)).save(data, "PNG")
    data.seek(0)
    data.filename = "portrait.png"
    return data


@pytest.fixture()
def functional_portal(functional):
    portal = functional["portal"]
    with api.env.adopt_user(SITE_OWNER_NAME):
        for username in ("withportrait", "noportrait"):
            api.user.create(email=f"{username}@example.org", username=username)
        api.portal.get_tool("portal_membership").changeMemberPortrait(
            _png(), "withportrait"
        )
        api.content.create(
            portal,
            type="Document",
            id="doc",
            title="Doc",
            creators=("withportrait", "noportrait"),
        )
    transaction.commit()
    yield portal


class TestBylineGet:
    @pytest.fixture(autouse=True)
    def _setup(self, functional_portal, manager_request):
        self.portal = functional_portal
        self.api_session = manager_request

    def test_portrait_of_user_with_portrait(self):
        response = self.api_session.get("/doc/@byline")
        user = response.json()["users"]["withportrait"]
        assert user["portrait"] == (
            f"{self.portal.absolute_url()}/@portrait/withportrait"
        )

    def test_portrait_of_user_without_portrait(self):
        response = self.api_session.get("/doc/@byline")
        user = response.json()["users"]["noportrait"]
        assert user["portrait"] is None
