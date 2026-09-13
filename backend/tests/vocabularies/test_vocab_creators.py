from plone.app.vocabularies import SimpleVocabulary

import pytest


class TestVocabCreators:
    name: str = "kitconcept.intranet.vocabularies.creators"
    vocab_type = SimpleVocabulary

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_vocabulary):
        self.portal = portal
        self.vocab = get_vocabulary(self.name, portal)

    def test_vocabulary_type(self):
        assert isinstance(self.vocab, self.vocab_type)

    def test_contains_site_content_creator(self):
        # The distribution's example content is created by admin, so
        # the catalog's unique Creator values contain it.
        tokens = [term.token for term in self.vocab._terms]
        assert "admin" in tokens

    def test_terms_have_titles(self):
        for term in self.vocab._terms:
            assert term.title

    def test_no_empty_tokens(self):
        # imported content may carry an empty creator - not a term
        for term in self.vocab._terms:
            assert term.token
