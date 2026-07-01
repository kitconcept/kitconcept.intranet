import pytest


@pytest.fixture(scope="class")
def answers():
    return {
        "site_id": "solr",
        "title": "Intranet",
        "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
        "workflow": "public",
        "available_languages": ["en"],
        "portal_timezone": "Europe/Berlin",
        "setup_content": True,
        "authentication": {"provider": "internal"},
        "setup_solr": True,
    }


@pytest.fixture(scope="class")
def portal(functional_portal):
    yield functional_portal


@pytest.mark.slow
@pytest.mark.solr
class TestSolrSearch:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, manager_request):
        self.portal = portal
        self.api_session = manager_request

    @pytest.mark.parametrize(
        "query,items",
        [
            ("plone", 9),
            ("kitconcept", 3),
        ],
    )
    def test_queries(self, query: str, items: int):
        response = self.api_session.get(f"/@solr?q={query}")
        data = response.json()
        assert isinstance(data, dict)
        docs = data["response"]["docs"]
        assert len(docs) == items
