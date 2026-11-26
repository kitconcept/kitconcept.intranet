"""Upgrade to 20261120001: Managers get the site root back on restricted sites."""

from collections.abc import Generator
from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME
from Products.CMFPlone.Portal import PloneSite
from Products.GenericSetup.tool import SetupTool

import pytest


DEFAULT_PROFILE = "kitconcept.intranet:default"
RESTRICTED_PROFILE = "kitconcept.intranet:restricted"
SOURCE = "20261117001"
DESTINATION = "20261120001"
RESTRICTED_SOURCE = "1001"
RESTRICTED_DESTINATION = "1002"
PERMISSIONS = ("Access contents information", "View")
ROLES = ("Manager", "Site Administrator")
# The roles the site root had before this release
BEFORE = ("Authenticated", "Member")
PASSWORD = "secret-password"  # noqa: S105


@pytest.fixture(scope="class")
def answers():
    return {
        "site_id": "intranet-upgrade",
        "title": "Intranet",
        "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noqa: E501
        "workflow": "restricted",
        "available_languages": ["en"],
        "portal_timezone": "Europe/Berlin",
        "setup_content": False,
        "authentication": {"provider": "internal"},
    }


@pytest.fixture(scope="class")
def restricted_portal(app_class, create_site, answers) -> Generator[PloneSite]:
    site = create_site(app=app_class, answers=answers)
    yield site


def roles_on(context, permission: str) -> list[str]:
    report = context.rolesOfPermission(permission)
    return [role["name"] for role in report if role["selected"]]


def set_before_release(context) -> None:
    """Put the site root back to the roles it had before this release."""
    with api.env.adopt_user(SITE_OWNER_NAME):
        for permission in PERMISSIONS:
            context.manage_permission(permission, roles=list(BEFORE), acquire=False)


def pending_steps(setup_tool: SetupTool, profile: str) -> list[tuple[str, str]]:
    """Return (source, destination) of every step pending for a profile."""
    steps: list[dict] = []
    for entry in setup_tool.listUpgrades(profile):
        steps.extend(entry if isinstance(entry, list) else [entry])
    return [(step["ssource"], step["sdest"]) for step in steps]


class TestRestrictedRolemap:
    """The rolemap of the restricted profile on a fresh restricted site."""

    @pytest.fixture(autouse=True)
    def _setup(self, restricted_portal):
        self.portal = restricted_portal

    @pytest.mark.parametrize("permission", PERMISSIONS)
    @pytest.mark.parametrize("role", ROLES)
    def test_roles_granted_at_site_root(self, permission: str, role: str):
        with api.env.adopt_user(SITE_OWNER_NAME):
            assert role in roles_on(self.portal, permission)

    @pytest.mark.parametrize("permission", PERMISSIONS)
    def test_anonymous_refused_at_site_root(self, permission: str):
        with api.env.adopt_user(SITE_OWNER_NAME):
            assert "Anonymous" not in roles_on(self.portal, permission)

    def test_adopted_manager_creates_content(self):
        """A Manager adopted by a logged-in user can create and submit content.

        Proxy roles replace the user's roles, so the adopted Manager has no
        View on the site root unless the rolemap grants it.
        """
        with api.env.adopt_user(SITE_OWNER_NAME):
            api.user.create(
                email="editor@example.org",
                username="editor",
                password=PASSWORD,
                roles=("Member",),
            )
        with (
            api.env.adopt_user(username="editor"),
            api.env.adopt_roles(["Manager"]),
        ):
            doc = api.content.create(
                container=self.portal,
                type="Document",
                id="adopted-doc",
                title="Adopted",
            )
            api.content.transition(obj=doc, transition="submit")
        chain = self.portal.portal_workflow.getChainFor(doc)
        assert doc.workflow_history[chain[0]][-1]["actor"] == "editor"


class TestUpgradeRestricted:
    """The step on a restricted site that has the pre-release rolemap."""

    @pytest.fixture(autouse=True)
    def _setup(self, restricted_portal):
        self.portal = restricted_portal
        self.setup_tool: SetupTool = restricted_portal.portal_setup
        with api.env.adopt_user(SITE_OWNER_NAME):
            assert self.setup_tool.getProfileImportDate(f"profile-{RESTRICTED_PROFILE}")
            set_before_release(self.portal)
            self.setup_tool.setLastVersionForProfile(
                RESTRICTED_PROFILE, RESTRICTED_SOURCE
            )
            self.setup_tool.setLastVersionForProfile(DEFAULT_PROFILE, SOURCE)

    def test_offered_from_source_version(self):
        assert pending_steps(self.setup_tool, DEFAULT_PROFILE)[0] == (
            SOURCE,
            DESTINATION,
        )

    @pytest.mark.parametrize("permission", PERMISSIONS)
    @pytest.mark.parametrize("role", ROLES)
    def test_upgrade_grants_roles(self, permission: str, role: str):
        with api.env.adopt_user(SITE_OWNER_NAME):
            assert role not in roles_on(self.portal, permission)
            self.setup_tool.upgradeProfile(DEFAULT_PROFILE)
            assert role in roles_on(self.portal, permission)

    def test_upgrade_bumps_versions(self):
        with api.env.adopt_user(SITE_OWNER_NAME):
            self.setup_tool.upgradeProfile(DEFAULT_PROFILE, dest=DESTINATION)
            default = self.setup_tool.getLastVersionForProfile(DEFAULT_PROFILE)
            restricted = self.setup_tool.getLastVersionForProfile(RESTRICTED_PROFILE)
        assert default == (DESTINATION,)
        assert restricted == (RESTRICTED_DESTINATION,)


class TestUpgradeNotRestricted:
    """The step on a site without the restricted profile leaves roles alone."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal_class):
        self.portal = portal_class
        self.setup_tool: SetupTool = portal_class.portal_setup
        with api.env.adopt_user(SITE_OWNER_NAME):
            assert not self.setup_tool.getProfileImportDate(
                f"profile-{RESTRICTED_PROFILE}"
            )
            set_before_release(self.portal)
            self.setup_tool.setLastVersionForProfile(DEFAULT_PROFILE, SOURCE)

    def test_offered_from_source_version(self):
        assert pending_steps(self.setup_tool, DEFAULT_PROFILE)[0] == (
            SOURCE,
            DESTINATION,
        )

    @pytest.mark.parametrize("permission", PERMISSIONS)
    def test_roles_not_granted(self, permission: str):
        with api.env.adopt_user(SITE_OWNER_NAME):
            self.setup_tool.upgradeProfile(DEFAULT_PROFILE)
            roles = roles_on(self.portal, permission)
            assert not self.setup_tool.getProfileImportDate(
                f"profile-{RESTRICTED_PROFILE}"
            )
        for role in ROLES:
            assert role not in roles
