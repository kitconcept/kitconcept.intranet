from plone import api
from zope.component.hooks import setSite

import pytest


class TestSiteCreation:
    """Test the creation of a Plone site with Solr support."""

    @pytest.fixture(autouse=True)
    def _setup(self, site):
        """Set up the site for testing."""
        setSite(site)
        self.portal = api.portal.get()

    @pytest.mark.parametrize(
        "profile_id",
        [
            "profile-kitconcept.intranet:solr",
            "profile-kitconcept.solr:default",
        ],
    )
    def test_profile_installed(self, profile_last_version, profile_id):
        result = profile_last_version(profile_id)
        assert isinstance(result, str)
        assert result != ""

    @pytest.mark.parametrize(
        "key,expected",
        [
            ["collective.solr.host", "127.0.0.1"],
            ["collective.solr.port", 8983],
            ["collective.solr.base", "/solr/plone"],
            ["collective.solr.use_tika", True],
        ],
    )
    def test_registry_keys(self, key, expected):
        """Test if registry keys are set."""
        value: str = api.portal.get_registry_record(key)
        assert value == expected

    @pytest.mark.parametrize(
        "item",
        [
            "UID",
            "Title",
            "Description",
            "Type",
            "effective",
            "start",
            "created",
            "end",
            "path_string",
            "mime_type",
            "location",
            "image_scales",
            "image_field",
        ],
    )
    def test_solr_config_fieldlist(self, item):
        key = "kitconcept.solr.config"
        values: list[str] = api.portal.get_registry_record(key)["fieldList"]
        assert item in values

    def test_solr_config_search_tabs(self):
        key = "kitconcept.solr.config"
        config: dict = api.portal.get_registry_record(key)
        values = config["searchTabs"]
        assert len(values) == 5
        assert values[0]["label"] == "All"
        assert values[0]["filter"] == "Type(*)"
