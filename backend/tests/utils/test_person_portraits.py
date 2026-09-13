from collective.person.behaviors.user import IPloneUser
from kitconcept.intranet.utils.person_portraits import sync_person_portraits
from plone import api
from plone.namedfile.file import NamedBlobImage
from Products.CMFPlone.Portal import PloneSite

import base64
import pytest


IMAGE_DATA = base64.b64decode("R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=")


class TestSyncPersonPortraits:
    @pytest.fixture(autouse=True)
    def _setup(self, portal: PloneSite) -> None:
        self.portal = portal

    def _create_person(self, person_id: str, **kwargs):
        username = kwargs.pop("username", None)
        with api.env.adopt_roles(["Manager"]):
            person = api.content.create(
                container=self.portal,
                type="Person",
                id=person_id,
                title=person_id,
                **kwargs,
            )
            IPloneUser(person).username = username
            return person

    def test_syncs_image_for_associated_user(self):
        api.user.create(email="jane@example.org", username="jane")
        self._create_person(
            "jane-doe",
            username="jane",
            image=NamedBlobImage(
                data=IMAGE_DATA,
                contentType="image/gif",
                filename="jane.gif",
            ),
        )

        assert sync_person_portraits(self.portal) == 1

        portrait = self.portal.portal_membership.getPersonalPortrait("jane")
        assert portrait.getId() == "jane"

    def test_skips_incomplete_or_unassociated_people(self):
        api.user.create(email="no-image@example.org", username="no-image")
        api.user.create(email="missing@example.org", username="missing-user")
        self._create_person("without-image", username="no-image")
        self._create_person(
            "without-username",
            image=NamedBlobImage(
                data=IMAGE_DATA,
                contentType="image/gif",
                filename="unknown.gif",
            ),
        )
        self._create_person(
            "without-user",
            username="missing-user",
            image=NamedBlobImage(
                data=IMAGE_DATA,
                contentType="image/gif",
                filename="missing.gif",
            ),
        )
        with api.env.adopt_roles(["Manager"]):
            api.user.delete(username="missing-user")

        assert sync_person_portraits(self.portal) == 0

    def test_does_not_overwrite_existing_portrait(self):
        api.user.create(email="john@example.org", username="john")
        person = self._create_person(
            "john-doe",
            username="john",
            image=NamedBlobImage(
                data=IMAGE_DATA,
                contentType="image/gif",
                filename="john.gif",
            ),
        )
        assert sync_person_portraits(self.portal) == 1

        person.image = NamedBlobImage(
            data=IMAGE_DATA,
            contentType="image/gif",
            filename="replacement.gif",
        )
        assert sync_person_portraits(self.portal) == 0
