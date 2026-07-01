from dataclasses import dataclass
from kitconcept.core.factory import add_site
from kitconcept.intranet.testing import FUNCTIONAL_TESTING
from kitconcept.intranet.testing import INTEGRATION_TESTING
from kitconcept.intranet.testing.logo import TEST_LOGO
from pathlib import Path
from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME
from Products.CMFPlone.Portal import PloneSite
from pytest_plone import fixtures_factory
from requests import exceptions as exc
from typing import Any

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
        base="20260701001",
        dependencies="1000",
        package=__version__,
    )


@pytest.fixture(scope="session")
def base_profile_id() -> str:
    """Fixture to get the base profile ID."""
    return "kitconcept.core:base"


@pytest.fixture(scope="session")
def answers() -> dict:
    return {
        "site_id": "plone2",
        "title": "Intranet",
        "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
        "available_languages": ["en"],
        "portal_timezone": "Europe/Berlin",
        "site_logo": TEST_LOGO,
        "workflow": "public",
        "setup_content": False,
        "authentication": {"provider": "internal"},
    }


@pytest.fixture(scope="session")
def create_site(distribution_name):
    def func(app, answers: dict) -> PloneSite:
        with api.env.adopt_user(SITE_OWNER_NAME):
            site = add_site(app, distribution=distribution_name, **answers)
        return site

    return func


def is_responsive(url):
    """Helper fixture to check if Solr is up and running."""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return b"""<str name="status">OK</str>""" in response.content
    except (exc.ConnectionError, exc.Timeout):
        return False


@pytest.fixture(scope="session")
def docker_compose_project_name() -> str:
    """Return the name of the Docker Compose project."""
    return "kitconcept-solr-tests"


@pytest.fixture(scope="session")
def docker_setup():
    """Return the Docker Compose commands to set up the stack."""
    # Stop the stack before starting a new one, only start the Solr service
    profile = "solr"
    return [f"--profile {profile} down -v", f"--profile {profile} up --build -d"]


@pytest.fixture(scope="session")
def docker_compose_file(pytestconfig):
    """Fixture pointing to the docker-compose file to be used."""
    backend_root = Path(str(pytestconfig.rootdir)).resolve()
    repo_root = backend_root.parent
    return repo_root / "docker-compose-dev.yml"


@pytest.fixture(scope="class")
def solr_service(docker_ip, docker_services):
    """Ensure that Solr service is up and responsive."""
    port = docker_services.port_for("solr-acceptance", 8983)
    url = f"http://{docker_ip}:{port}/solr/plone/admin/ping?wt=xml"
    docker_services.wait_until_responsive(
        timeout=90.0, pause=0.1, check=lambda: is_responsive(url)
    )
    return url


@pytest.fixture(scope="class")
def solr_settings(docker_ip, docker_services, solr_service) -> dict:
    port = docker_services.port_for("solr-acceptance", 8983)
    return {
        "collective.solr.active": True,
        "collective.solr.host": docker_ip,
        "collective.solr.port": port,
        "collective.solr.base": "/solr/plone",
    }


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
                assert value.startswith(expected), (
                    f"{value} does not start with {expected}"
                )
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
