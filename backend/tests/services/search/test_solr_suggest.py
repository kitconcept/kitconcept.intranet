"""@solr-suggest local (subtree) scoping via the path_prefix parameter.

Mirrors the TestSuggestPathPrefix integration test in kitconcept.solr,
exercised here through the intranet stack with the distribution's
example content. The assertions are content-independent invariants:
a scoped call returns exactly the global suggestions that live under
the prefix, and a prefix without matches returns nothing.
"""

from urllib.parse import urlparse

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
class TestSolrSuggestPathPrefix:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, manager_request):
        self.portal = portal
        self.api_session = manager_request

    def _suggest_paths(self, query: str, path_prefix: str | None = None):
        url = f"/@solr-suggest?query={query}"
        if path_prefix:
            url += f"&path_prefix={path_prefix}"
        response = self.api_session.get(url)
        data = response.json()
        return [urlparse(item["@id"]).path for item in data["suggestions"]]

    def test_scoped_returns_the_subtree_subset_of_global(self):
        paths = self._suggest_paths("standort")
        assert len(paths) >= 1
        # scope to the top-level folder of the first suggestion
        top = "/" + paths[0].split("/")[2]
        scoped = self._suggest_paths("standort", path_prefix=top)
        expected = [p for p in paths if p.startswith(f"/solr{top}")]
        assert scoped == expected
        assert len(scoped) >= 1

    def test_prefix_without_matches_returns_empty(self):
        assert self._suggest_paths("standort") != []
        assert self._suggest_paths("standort", path_prefix="/does-not-exist") == []
