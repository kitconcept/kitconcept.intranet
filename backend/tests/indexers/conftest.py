import pytest


@pytest.fixture
def portal(portal_class, example_content_factory):
    example_content_factory(portal_class)
    yield portal_class
