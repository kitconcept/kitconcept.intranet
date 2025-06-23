from plone import api

import json
import pytest


KEY = "pas.plugins.authomatic.interfaces.IPasPluginsAuthomaticSettings.json_config"


@pytest.fixture(scope="session")
def get_registry():
    def func(site, key) -> dict:
        from zope.component.hooks import setSite

        setSite(site)
        return api.portal.get_registry_record(key)

    return func


@pytest.fixture(scope="session")
def authomatic_config(get_registry):
    def func(site) -> dict:
        return json.loads(get_registry(site, KEY))

    return func
