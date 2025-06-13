from dataclasses import dataclass
from kitconcept.intranet.testing import FUNCTIONAL_TESTING
from kitconcept.intranet.testing import INTEGRATION_TESTING
from pathlib import Path
from pytest_plone import fixtures_factory
from requests import exceptions as exc
from typing import Any
from zope.component.hooks import site

import pytest
import requests


pytest_plugins = ["pytest_plone"]
globals().update(
    fixtures_factory((
        (FUNCTIONAL_TESTING, "functional"),
        (INTEGRATION_TESTING, "integration"),
    ))
)


@pytest.fixture(scope="session")
def distribution_name() -> str:
    """Distribution name."""
    return "kitconcept-intranet"


def is_responsive(url):
    """Helper fixture to check if Solr is up and running."""
    try:
        response = requests.get(url)  # noQA: S113
        if response.status_code == 200:
            return b"""<str name="status">OK</str>""" in response.content
    except (exc.ConnectionError, exc.Timeout):
        return False


@pytest.fixture(scope="session")
def docker_compose_file(pytestconfig):
    """Fixture pointing to the docker-compose file to be used."""
    return Path(str(pytestconfig.rootdir)).resolve() / "tests" / "docker-compose.yml"


@pytest.fixture(scope="class")
def portal_class(integration_class):
    if hasattr(integration_class, "testSetUp"):
        integration_class.testSetUp()
    portal = integration_class["portal"]
    with site(portal):
        yield portal
    if hasattr(integration_class, "testTearDown"):
        integration_class.testTearDown()


@pytest.fixture
def traverse():
    def func(data: dict | list, path: str) -> Any:
        func = None
        path = path.split(":")
        if len(path) == 2:
            func, path = path
        else:
            path = path[0]
        parts = [part for part in path.split("/") if part.strip()]
        value = data
        for part in parts:
            if isinstance(value, list):
                part = int(part)
            value = value[part]
        match func:
            # Add other functions here
            case "len":
                value = len(value)
            case "type":
                # This makes it easier to compare
                value = type(value).__name__
            case "is_uuid4":
                value = len(value) == 32 and value[15] == "4"
            case "keys":
                value = list(value.keys())
            case "keys":
                value = list(value.keys())
        return value

    return func


@dataclass
class CurrentVersions:
    base: str
    dependencies: str
    package: str


@pytest.fixture(scope="session")
def current_versions() -> CurrentVersions:
    from kitconcept.core import __version__

    return CurrentVersions(
        base="20250612001",
        dependencies="1000",
        package=__version__,
    )


@pytest.fixture(scope="session")
def base_profile_id() -> str:
    """Fixture to get the base profile ID."""
    return "kitconcept.core:base"
