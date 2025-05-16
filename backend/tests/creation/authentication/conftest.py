from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME
from plone.distribution.api import site as site_api
from Products.CMFPlone.Portal import PloneSite
from zope.component.hooks import setSite

import json
import pytest


KEY = "pas.plugins.authomatic.interfaces.IPasPluginsAuthomaticSettings.json_config"


@pytest.fixture
def create_site(app, distribution_name):
    def func(answers: dict) -> PloneSite:
        with api.env.adopt_user(SITE_OWNER_NAME):
            site = site_api.create(app, distribution_name, answers)
            setSite(site)
        return site

    return func


@pytest.fixture
def authomatic_config():
    def func() -> dict:
        return json.loads(api.portal.get_registry_record(KEY))

    return func
