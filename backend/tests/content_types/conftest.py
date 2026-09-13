from collections.abc import Callable
from collections.abc import Generator
from plone import api
from plone.dexterity.content import DexterityContent
from typing import Any
from zope.event import notify
from zope.lifecycleevent import ObjectModifiedEvent

import pytest


@pytest.fixture(scope="class")
def portal(portal_class):
    yield portal_class


@pytest.fixture(scope="session")
def content_factory() -> Callable[[DexterityContent, dict], DexterityContent]:
    """Return a factory to create content inside a container.

    :returns: Callable taking a container and a creation payload -- keys
        starting with ``_`` are dropped -- and returning the new content.
    """

    def func(container: DexterityContent, payload: dict) -> DexterityContent:
        payload = {k: v for k, v in payload.items() if not k.startswith("_")}
        with api.env.adopt_roles(["Manager"]):
            content = api.content.create(container=container, **payload)
        return content

    return func


@pytest.fixture(scope="class")
def container(portal) -> DexterityContent:
    """Return the container used to create the content instance under test.

    :param portal: Plone site.
    :returns: Container for newly created content -- the portal, by default.
    """
    return portal


@pytest.fixture(scope="class")
def content_instance(
    content_factory: Callable[[DexterityContent, dict], DexterityContent],
    container: DexterityContent,
    payload: dict,
) -> Generator[DexterityContent]:
    """Create a content instance for the test class and remove it afterwards.

    :param content_factory: Factory returned by :func:`content_factory`.
    :param container: Container the content is created in.
    :param payload: Creation payload, provided by the test module.
    :returns: Generator yielding the new content object.
    """
    with api.env.adopt_roles(["Manager"]):
        content = content_factory(container, payload)
    content_id = content.id
    yield content
    # Cleanup after test
    with api.env.adopt_roles(["Manager"]):
        if content_id in container:
            container.manage_delObjects([content_id])


@pytest.fixture(scope="session")
def last_version() -> Callable[[DexterityContent], Any]:
    """Return a helper to retrieve the latest version of a content object.

    :returns: Callable taking a content object and returning its
        ``IVersionData`` as stored in ``portal_repository``.
    """

    def func(content: DexterityContent) -> Any:
        repo_tool = api.portal.get_tool("portal_repository")
        with api.env.adopt_roles(["Manager"]):
            return repo_tool.retrieve(content)

    return func


@pytest.fixture(scope="session")
def history() -> Callable[[DexterityContent], Any]:
    """Return a helper to retrieve the version history of a content object.

    :returns: Callable taking a content object and returning its
        ``IHistory`` as stored in ``portal_repository``.
    """

    def func(content: DexterityContent) -> Any:
        repo_tool = api.portal.get_tool("portal_repository")
        with api.env.adopt_roles(["Manager"]):
            return repo_tool.getHistory(content)

    return func


@pytest.fixture
def versionable_content_types(portal) -> list[str]:
    """Return the portal types versioning is enabled for.

    :param portal: Plone site.
    :returns: Portal type ids registered in ``portal_repository``.
    """
    repo_tool = api.portal.get_tool("portal_repository")
    return repo_tool.getVersionableContentTypes()


@pytest.fixture
def notify_modified(portal) -> Callable[[DexterityContent], None]:
    """Return a helper to fire an ``ObjectModifiedEvent`` for a content object.

    :param portal: Plone site.
    :returns: Callable taking a content object and notifying it was modified.
    """

    def func(content: DexterityContent) -> None:
        notify(ObjectModifiedEvent(content))

    return func
