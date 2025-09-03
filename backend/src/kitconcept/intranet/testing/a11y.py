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
from plone.app.robotframework.testing import PloneRobotFixture
from plone.app.robotframework.users import Users
from plone.app.testing import FunctionalTesting


ANSWERS_EXAMPLE_CONTENT = {
    "site_id": "plone",
    "title": "Intranet",
    "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
    "available_languages": ["en"],
    "portal_timezone": "Europe/Berlin",
    "workflow": "public",
    "setup_content": True,
    "authentication": {"provider": "internal"},
}


class ExampleContentFixture(BaseFixture):
    sites = (("kitconcept-intranet", ANSWERS_EXAMPLE_CONTENT),)


EXAMPLE_CONTENT_FIXTURE = ExampleContentFixture()


class A11YFixture(PloneRobotFixture):
    """Acceptance testing fixture, using robot framework, for kitconcept.intranet."""

    defaultBases = (EXAMPLE_CONTENT_FIXTURE,)

    def setUpPloneSite(self, portal):
        super().setUpPloneSite(portal)


A11Y_FIXTURE = A11YFixture()

REMOTE_LIBRARY_BUNDLE_FIXTURE = RemoteLibraryLayer(
    bases=(EXAMPLE_CONTENT_FIXTURE,),
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
    name="RemoteLibraryBundle:RobotRemote",
)

A11Y_TESTING = FunctionalTesting(
    bases=(
        A11Y_FIXTURE,
        REMOTE_LIBRARY_BUNDLE_FIXTURE,
        WSGI_SERVER_SINGLE_THREADED_FIXTURE,
    ),
    name="Intranet:A11Y",
)
