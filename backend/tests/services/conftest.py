import pytest


@pytest.fixture()
def portal(functional_portal):
    yield functional_portal


@pytest.fixture(scope="class")
def portal_class(functional_portal_class):
    yield functional_portal_class
