import pytest


@pytest.fixture(scope="class")
def portal(portal_class):
    yield portal_class


class TestMaintenanceBannerControlpanel:
    @pytest.fixture(autouse=True)
    def _setup(self, manager_request):
        self.api_session = manager_request

    def test_controlpanel_listed(self):
        response = self.api_session.get("/@controlpanels")
        ids = [item["@id"].split("/")[-1] for item in response.json()]
        assert "maintenance-banner" in ids

    def test_controlpanel_get(self):
        response = self.api_session.get("/@controlpanels/maintenance-banner")
        assert response.status_code == 200
        data = response.json()
        assert set(data["schema"]["properties"]) == {
            "show_banner",
            "banner_title",
            "banner_text",
            "date",
        }


class TestMaintenanceBannerService:
    @pytest.fixture(autouse=True)
    def _setup(self, manager_request, anon_request):
        self.api_session = manager_request
        self.anon_session = anon_request

    def test_anonymous_get(self):
        response = self.anon_session.get("/@maintenance-banner")
        assert response.status_code == 200
        data = response.json()
        assert data["show_banner"] is False
        assert data["banner_title"] == "Warning"

    def test_patch_updates_banner(self):
        response = self.api_session.patch(
            "/@controlpanels/maintenance-banner",
            json={
                "show_banner": True,
                "banner_title": "Downtime",
                "banner_text": {
                    "data": "<p>Back soon</p>",
                    "content-type": "text/html",
                    "encoding": "utf-8",
                },
                "date": "2026-11-01",
            },
        )
        assert response.status_code == 204
        data = self.anon_session.get("/@maintenance-banner").json()
        assert data["show_banner"] is True
        assert data["banner_title"] == "Downtime"
        assert data["banner_text"]["data"] == "<p>Back soon</p>"
        assert data["date"] == "2026-11-01"
