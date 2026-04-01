import pytest


@pytest.fixture
def portal(portal_class):
    yield portal_class
