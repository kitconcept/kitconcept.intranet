from plone.app.vocabularies import SimpleVocabulary

import pytest


class TestVocab:
    name: str = "kitconcept.intranet.vocabularies.content_review_intervals"
    vocab_type = SimpleVocabulary

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_vocabulary):
        self.portal = portal
        self.vocab = get_vocabulary(self.name, portal)

    def test_vocabulary_type(self):
        assert isinstance(self.vocab, self.vocab_type)

    def test_vocab_terms(self):
        assert [(term.token, term.title) for term in self.vocab._terms] == [
            ("3m", "Every 3 months"),
            ("6m", "Every 6 months"),
            ("1y", "Every year"),
            ("2y", "Every 2 years"),
        ]
