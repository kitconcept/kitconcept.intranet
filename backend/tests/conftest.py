from dataclasses import dataclass
from kitconcept.intranet.testing import FUNCTIONAL_TESTING
from kitconcept.intranet.testing import INTEGRATION_TESTING
from pathlib import Path
from plone import api
from plone.distribution.api import distribution as dist_api
from pytest_plone import fixtures_factory
from requests import exceptions as exc
from typing import Any
from zope.component.hooks import site

import pytest
import requests


pytest_plugins = ["pytest_plone"]
globals().update(
    fixtures_factory(
        (
            (FUNCTIONAL_TESTING, "functional"),
            (INTEGRATION_TESTING, "integration"),
        )
    )
)


@pytest.fixture(scope="session")
def distribution_name() -> str:
    """Distribution name."""
    return "kitconcept-intranet"


@pytest.fixture(scope="class")
def example_content_folder(distribution_name) -> Path:
    """Return the path to the example content folder."""
    distribution = dist_api.get(distribution_name)
    return distribution.contents["json"]


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


@pytest.fixture(scope="session")
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


@pytest.fixture(scope="class")
def example_content_factory(example_content_folder):
    """Fixture to return a factory to handle example content."""
    from plone.exportimport import importers

    def factory(portal) -> None:
        """Import example content into an existing site."""
        importer = importers.get_importer(portal)
        _ = importer.import_site(example_content_folder)

    return factory


@pytest.fixture(scope="module")
def checker():
    def func(value: Any, oper: str, expected: Any):
        match oper:
            case "in":
                assert expected in value, f"{expected} not found in {value}"
            case "not in":
                assert expected not in value, f"{expected} found in {value}"
            case "eq":
                assert expected == value, f"{expected} != {value}"
            case "ne":
                assert expected != value, f"{expected} == {value}"
            case "is":
                assert value is expected, f"{value} is not {expected}"
            case "is not":
                assert value is not expected, f"{value} is {expected}"
            case "starts":
                assert value.startswith(
                    expected
                ), f"{value} does not start with {expected}"
            case _:
                raise ValueError(f"Unknown operation: {oper}")

    return func


@pytest.fixture
def registry_checker(checker):
    """Fixture to check registry settings."""

    def func(record: str, oper: str, expected: Any):
        """Check registry settings."""
        value = api.portal.get_registry_record(record, default=None)
        return checker(value, oper, expected)

    return func
