from plone.dexterity.content import Container
from plone.dexterity.content import DexterityContent
from plone.dexterity.fti import DexterityFTI
from plone.dexterity.utils import resolveDottedName
from zope.component import createObject

import pytest


@pytest.fixture
def portal_type() -> str:
    return "WikiPage"


@pytest.fixture
def container(portal, content_factory, payload_workspace) -> DexterityContent:
    container = portal
    payloads = [payload_workspace]
    for payload in payloads:
        container = content_factory(container, payload)
    return container


@pytest.fixture
def payload(payload_wiki) -> dict:
    return payload_wiki


class TestContentTypeFTI:
    @pytest.fixture(autouse=True)
    def _setup(self, portal_class):
        self.portal = portal_class

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Wiki Page"),
            ("description", "A Plate-powered wiki page."),
            ("allow_discussion", False),
            ("global_allow", False),
            ("filter_content_types", True),
            (
                "allowed_content_types",
                (
                    "WikiPage",
                    "File",
                    "Image",
                ),
            ),
            (
                "behaviors",
                (
                    "plone.basic",
                    "volto.preview_image_link",
                    "plone.categorization",
                    "plone.publication",
                    "plone.ownership",
                    "plone.relateditems",
                    "plone.shortname",
                    "volto.navtitle",
                    "plone.excludefromnavigation",
                    "plone.allowdiscussion",
                    "volto.blocks",
                    "plone.constraintypes",
                    "plone.namefromtitle",
                    "plone.versioning",
                    "plone.locking",
                    "plone.translatable",
                ),
            ),
        ],
    )
    def test_fti(self, get_fti, portal_type, attr: str, expected):
        """Test FTI values."""
        fti: DexterityFTI = get_fti(portal_type)

        assert isinstance(fti, DexterityFTI)
        assert getattr(fti, attr) == expected

    def test_factory(self, get_fti, portal_type):
        fti = get_fti(portal_type)
        factory = fti.factory
        klass = resolveDottedName(fti.klass)
        obj = createObject(factory)
        assert obj is not None
        assert isinstance(obj, klass)
        assert obj.portal_type == portal_type


class TestContentType:
    @pytest.fixture(autouse=True)
    def _setup(self, container):
        self.container = container

    def test_create(self, content_factory, payload, portal_type):
        content = content_factory(self.container, payload)
        assert content.portal_type == portal_type
        assert isinstance(content, Container)

    @pytest.mark.parametrize(
        "role,expected",
        [
            ["Manager", True],
            ["Site Administrator", False],
            ["Owner", False],
            ["Editor", False],
            ["Contributor", False],
            ["Reader", False],
            ["Anonymous", False],
        ],
    )
    def test_create_permission(
        self, roles_permission_on, permission, role: str, expected: bool
    ):
        roles = roles_permission_on(permission, self.container)
        assert (role in roles) is expected
