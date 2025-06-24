from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME
from plone.distribution.api import site as site_api
from Products.CMFPlone.Portal import PloneSite
from zope.component.hooks import setSite

import pytest


@pytest.fixture(scope="class")
def app(functional_class):
    if hasattr(functional_class, "testSetUp"):
        functional_class.testSetUp()
    yield functional_class["app"]
    if hasattr(functional_class, "testTearDown"):
        functional_class.testTearDown()


@pytest.fixture(scope="class")
def http_request(functional_class):
    yield functional_class["request"]


@pytest.fixture(scope="class")
def create_site(app, base_profile_id, distribution_name):
    def func(answers: dict) -> PloneSite:
        with api.env.adopt_user(SITE_OWNER_NAME):
            site = site_api.create(app, distribution_name, answers, base_profile_id)
            setSite(site)
        return site

    return func


@pytest.fixture()
def roles_permission():
    def func(context, permission: str) -> list[str]:
        report = context.rolesOfPermission(permission)
        return [role["name"] for role in report if role["selected"]]

    return func


@pytest.fixture(scope="class")
def site(create_site, answers):
    site = create_site(answers)
    setSite(site)
    return site
