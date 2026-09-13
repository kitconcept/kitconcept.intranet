import pytest


@pytest.fixture(scope="class")
def portal(portal_class):
    yield portal_class
