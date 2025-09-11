from kitconcept.intranet import PACKAGE_NAME
from plone import api
from typing import Any

import pytest


class TestSetupInstall:
    profile_id: str = f"{PACKAGE_NAME}:default"

    def test_addon_installed(self, installer):
        """Test if kitconcept.intranet is installed."""
        assert installer.is_product_installed(PACKAGE_NAME) is True

    def test_browserlayer(self, browser_layers):
        """Test that IBrowserLayer is registered."""
        from kitconcept.intranet.interfaces import IBrowserLayer

        assert IBrowserLayer in browser_layers


class TestRegistrySettings:
    @pytest.fixture(autouse=True)
    def _setup(self, portal_class):
        """Setup the portal for registry settings tests."""
        self.portal = portal_class

    @pytest.mark.parametrize(
        "record,oper,value",
        [
            # Location reference field
            ("plone.displayed_types", "in", "Location"),
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
            (
                "plone.app.querystring.field.location_reference.enabled",
                "is",
                True,
            ),
            (
                "plone.app.querystring.field.location_reference.sortable",
                "is",
                False,
            ),
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
            (
                "plone.app.querystring.field.location_reference.group",
                "eq",
                "Taxonomy",
            ),
            # Organisational Unit reference field
            (
                "plone.app.querystring.field.organisational_unit_reference.title",
                "eq",
                "label_organisational_unit",
            ),
            (
                "plone.app.querystring.field.organisational_unit_reference.description",
                "eq",
                "help_organisational_unit",
            ),
            (
                "plone.app.querystring.field.organisational_unit_reference.enabled",
                "is",
                True,
            ),
            (
                "plone.app.querystring.field.organisational_unit_reference.sortable",
                "is",
                False,
            ),
            (
                "plone.app.querystring.field.organisational_unit_reference.operations",
                "in",
                "plone.app.querystring.operation.selection.any",
            ),
            (
                "plone.app.querystring.field.organisational_unit_reference.vocabulary",
                "in",
                "kitconcept.intranet.vocabularies.organisational_unit",
            ),
            (
                "plone.app.querystring.field.organisational_unit_reference.group",
                "eq",
                "Taxonomy",
            ),
        ],
    )
    def test_registry_settings(self, record: str, oper: str, value: Any):
        """Test registry settings."""
        record_value = api.portal.get_registry_record(record, default=None)
        match oper:
            case "in":
                assert value in record_value
            case "not in":
                assert value not in record_value
            case "eq":
                assert value == record_value
            case "ne":
                assert value != record_value
            case "is":
                assert record_value is value
            case "is not":
                assert record_value is not value
