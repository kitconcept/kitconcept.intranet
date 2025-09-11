import pytest


@pytest.fixture(scope="class")
def portal(portal_class):
    yield portal_class


class TestSiteGet:
    @pytest.fixture(autouse=True)
    def _setup(self, api_manager_request, current_versions):
        self.api_session = api_manager_request
        self.profile_version = current_versions.base

    def test_response_type(self):
        response = self.api_session.get("/@site")
        data = response.json()
        assert isinstance(data, dict)

    @pytest.mark.parametrize(
        "key,type_",
        (("kitconcept.person_picture_aspect_ratio", str),),
    )
    def test_keys(self, key, type_):
        response = self.api_session.get("/@site")
        data = response.json()
        assert key in data
        assert isinstance(data[key], type_)

    @pytest.mark.parametrize(
        "key,expected",
        (("kitconcept.person_picture_aspect_ratio", "rounded1to1"),),
    )
    def test_values(self, key, expected):
        response = self.api_session.get("/@site")
        data = response.json()
        assert data[key] == expected
