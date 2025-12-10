import pytest


@pytest.fixture(scope="class")
def portal(site):
    yield site


class TestSolrSearch:
    @pytest.fixture(autouse=True)
    def _setup(self, api_manager_request):
        self.api_session = api_manager_request

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
