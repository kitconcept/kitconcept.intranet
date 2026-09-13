from plone import api
from typing import Any

import pytest


@pytest.mark.slow
@pytest.mark.solr
class TestSiteCreation:
    """Test the creation of a Plone site with Solr support."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        """Set up the site for testing."""
        self.portal = portal

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
    def test_registry_keys(self, key: str, expected: Any):
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
            {
                "name": "organisational_unit_reference",
                "vocabulary": {
                    "name": "kitconcept.intranet.vocabularies.organisational_unit",
                    "isMultilingual": True,
                },
            },
            {
                "name": "location_reference",
                "vocabulary": {
                    "name": "kitconcept.intranet.vocabularies.location",
                    "isMultilingual": True,
                },
            },
        ],
    )
    def test_solr_config_fieldlist(self, item: dict[str, Any]):
        key = "kitconcept.solr.config"
        values: list[str] = api.portal.get_registry_record(key)["fieldList"]
        assert item in values

    def test_solr_config_search_tabs(self) -> None:
        key = "kitconcept.solr.config"
        config: dict = api.portal.get_registry_record(key)
        values = config["searchTabs"]
        assert len(values) == 6
        assert values[0]["label"] == "All"
        assert values[0]["filter"] == "Type(*)"
