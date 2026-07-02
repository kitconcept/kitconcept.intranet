from plone import api

import json
import pytest


KEY = "pas.plugins.authomatic.interfaces.IPasPluginsAuthomaticSettings.json_config"


@pytest.fixture(scope="session")
def authomatic_config():
    def func() -> dict:
        return json.loads(api.portal.get_registry_record(KEY))

    return func
