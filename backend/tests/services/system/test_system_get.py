from kitconcept.core import PACKAGE_NAME
from kitconcept.core import __version__

import pytest


@pytest.fixture(scope="class")
def portal(portal_class):
    yield portal_class


class TestSystemGet:
    @pytest.fixture(autouse=True)
    def _setup(self, api_manager_request, current_versions):
        self.api_session = api_manager_request
        self.profile_version = current_versions.base

    def test_response_type(self):
        response = self.api_session.get("/@system")
        data = response.json()
        assert isinstance(data, dict)

    @pytest.mark.parametrize(
        "key,type_",
        (
            ("@id", str),
            ("cmf_version", str),
            ("debug_mode", str),
            ("distribution", dict),
            ("pil_version", str),
            ("plone_restapi_version", str),
            ("plone_version", str),
            ("plone_volto_version", str),
            ("core", dict),
            ("python_version", str),
            ("upgrade", bool),
        ),
    )
    def test_keys(self, key, type_):
        response = self.api_session.get("/@system")
        data = response.json()
        assert key in data
        assert isinstance(data[key], type_)

    @pytest.mark.parametrize(
        "key,expected",
        (
            ("cmf_version", "3.7"),
            ("debug_mode", "No"),
            ("plone_restapi_version", "9.15.3"),
            ("plone_version", "6.1.3"),
            ("upgrade", False),
        ),
    )
    def test_values(self, key, expected):
        response = self.api_session.get("/@system")
        data = response.json()
        assert data[key] == expected

    @pytest.mark.parametrize(
        "key,expected",
        (
            ("profile_version_file_system", "current_profile_version"),
            ("profile_version_installed", "current_profile_version"),
            ("name", PACKAGE_NAME),
            ("version", __version__),
        ),
    )
    def test_kitconcept_core(self, key, expected):
        expected = (
            self.profile_version if expected == "current_profile_version" else expected
        )
        response = self.api_session.get("/@system")
        data = response.json()
        assert data["core"][key] == expected

    @pytest.mark.parametrize(
        "key,expected",
        (
            ("name", "kitconcept-intranet"),
            ("package_name", "kitconcept.intranet"),
            ("title", "kitconcept Intranet"),
        ),
    )
    def test_distribution(self, key, expected):
        response = self.api_session.get("/@system")
        data = response.json()
        assert data["distribution"][key] == expected
