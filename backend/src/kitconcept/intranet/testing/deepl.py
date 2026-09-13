"""Acceptance testing layer for the DeepL translation tests.

The intranet itself is monolingual, so the regular ``ROBOT_TESTING`` layer
stays English-only. The DeepL acceptance tests need a multilingual (en/de)
site with the DeepLSettings control panel, so they get their own layer that
installs the ``kitconcept.deepl`` profiles on top of the base fixture.
"""

from kitconcept.intranet.testing.base import BaseFixture
from plone.app.robotframework.autologin import AutoLogin
from plone.app.robotframework.content import Content
from plone.app.robotframework.genericsetup import GenericSetup
from plone.app.robotframework.i18n import I18N
from plone.app.robotframework.mailhost import MockMailHost
from plone.app.robotframework.quickinstaller import QuickInstaller
from plone.app.robotframework.remote import RemoteLibraryLayer
from plone.app.robotframework.server import Zope2ServerRemote
from plone.app.robotframework.testing import WSGI_SERVER_SINGLE_THREADED_FIXTURE
from plone.app.robotframework.testing import MockMailHostLayer as BaseMailLayer
from plone.app.robotframework.testing import PloneRobotFixture
from plone.app.robotframework.users import Users
from plone.app.testing import applyProfile
from plone.app.testing import FunctionalTesting
from plone.app.testing.interfaces import SITE_OWNER_NAME
from plone.testing import zope
from zope.globalrequest import setRequest


ANSWERS_CONTENT = {
    "site_id": "plone",
    "title": "Intranet",
    "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
    "available_languages": ["en", "de"],
    "portal_timezone": "Europe/Berlin",
    "workflow": "public",
    "setup_content": False,
    "authentication": {"provider": "internal"},
}


class DeepLContentFixture(BaseFixture):
    sites = (("kitconcept-intranet", ANSWERS_CONTENT),)
    # Load kitconcept.deepl ZCML so its control panel / services are available.
    internal_packages = BaseFixture.internal_packages + ("kitconcept.deepl",)

    def setUpDefaultContent(self, app):
        super().setUpDefaultContent(app)
        # Install the DeepL profiles on each created site so that the
        # multilingual (en/de) language roots and the DeepLSettings control
        # panel exist for the DeepL acceptance tests.
        setRequest(app.REQUEST)
        zope.login(app["acl_users"], SITE_OWNER_NAME)
        for _distribution_name, answers in self.sites:
            portal = app[answers["site_id"]]
            applyProfile(portal, "kitconcept.deepl:initial")
            applyProfile(portal, "kitconcept.deepl:default")
        zope.logout()
        setRequest(None)


DEEPL_CONTENT_FIXTURE = DeepLContentFixture()


class DeepLMockMailHostLayer(BaseMailLayer):
    defaultBases = (DEEPL_CONTENT_FIXTURE,)


DEEPL_MOCK_MAILHOST_FIXTURE = DeepLMockMailHostLayer()


class DeepLRobotFixture(PloneRobotFixture):
    """DeepL acceptance fixture, using robot framework, for kitconcept.intranet."""

    defaultBases = (DEEPL_MOCK_MAILHOST_FIXTURE,)

    def setUpPloneSite(self, portal):
        super().setUpPloneSite(portal)


DEEPL_ROBOT_FIXTURE = DeepLRobotFixture()

DEEPL_REMOTE_LIBRARY_BUNDLE_FIXTURE = RemoteLibraryLayer(
    bases=(DEEPL_CONTENT_FIXTURE,),
    libraries=(
        AutoLogin,
        QuickInstaller,
        GenericSetup,
        Content,
        Users,
        I18N,
        MockMailHost,
        Zope2ServerRemote,
    ),
    name="DeepLRemoteLibraryBundle:RobotRemote",
)

DEEPL_ROBOT_TESTING = FunctionalTesting(
    bases=(
        DEEPL_ROBOT_FIXTURE,
        DEEPL_REMOTE_LIBRARY_BUNDLE_FIXTURE,
        WSGI_SERVER_SINGLE_THREADED_FIXTURE,
    ),
    name="Intranet:DeepLRobot",
)
