from typing import Any

import pytest


class TestRegistrySettings:
    """Default answers come from kitconcept.intranet.testing.base.DEFAULT_ANSWERS."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal_class):
        """Setup the portal for registry settings tests."""
        self.portal = portal_class

    @pytest.mark.parametrize(
        "record,oper,expected",
        [
            ("plone.site_title", "eq", "Intranet"),
            ("plone.displayed_types", "in", "Location"),
            ("plone.default_language", "eq", "en"),
            ("plone.available_languages", "eq", ["en"]),
            ("plone.site_logo", "starts", b"filenameb64"),
        ],
    )
    def test_registry_portal_settings(
        self, registry_checker, record: str, oper: str, expected: Any
    ):
        """Test registry settings."""
        registry_checker(record, oper, expected)

    @pytest.mark.parametrize(
        "record,oper,expected",
        [
            (
                "plone.app.querystring.field.location_reference.title",
                "eq",
                "label_place",
            ),
            (
                "plone.app.querystring.field.location_reference.description",
                "eq",
                "help_place",
            ),
            ("plone.app.querystring.field.location_reference.enabled", "is", True),
            ("plone.app.querystring.field.location_reference.sortable", "is", False),
            (
                "plone.app.querystring.field.location_reference.operations",
                "in",
                "plone.app.querystring.operation.selection.any",
            ),
            (
                "plone.app.querystring.field.location_reference.vocabulary",
                "in",
                "kitconcept.intranet.vocabularies.location",
            ),
            ("plone.app.querystring.field.location_reference.group", "eq", "Taxonomy"),
        ],
    )
    def test_registry_querystring(
        self, registry_checker, record: str, oper: str, expected: Any
    ):
        """Test registry settings."""
        registry_checker(record, oper, expected)
