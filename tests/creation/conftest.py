import pytest


@pytest.fixture()
def app(functional):
    return functional["app"]


@pytest.fixture()
def base_portal(app):
    return app["plone"]


@pytest.fixture()
def http_request(functional):
    return functional["request"]
