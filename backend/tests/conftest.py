from kitconcept.intranet.testing import FUNCTIONAL_TESTING
from kitconcept.intranet.testing import INTEGRATION_TESTING
from pathlib import Path
from pytest_plone import fixtures_factory
from requests import exceptions as exc
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


@pytest.fixture
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
