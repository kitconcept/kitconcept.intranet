from collective.person.behaviors.user import IPloneUser
from kitconcept.intranet.utils.person_portraits import sync_person_portraits
from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

import pytest


@pytest.fixture(scope="class")
def answers():
    return {
        "site_id": "portraits",
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
class TestExampleContentPortraits:
    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.site = portal

    @pytest.mark.parametrize(
        "username",
        [
            "a.becker",
            "b.yilmaz",
            "c.beck",
            "c.nguyen",
            "d.schmidt",
            "e.roth",
            "f.meier",
            "m.engelhardt",
            "s.lehner",
        ],
    )
    def test_person_image_is_used_as_user_portrait(self, username):
        person = next(
            brain.getObject()
            for brain in api.content.find(context=self.site, portal_type="Person")
            if IPloneUser(brain.getObject()).username == username
        )
        assert person.image is not None
        assert sync_person_portraits(self.site) == 0
        portrait = self.site.portal_membership.getPersonalPortrait(username)
        assert portrait.getId() == username

    def test_site_owner_keeps_default_portrait(self):
        portrait = self.site.portal_membership.getPersonalPortrait(SITE_OWNER_NAME)
        assert portrait.getId() == "defaultUser.png"
