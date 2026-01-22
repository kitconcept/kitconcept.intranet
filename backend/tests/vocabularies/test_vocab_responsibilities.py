from plone.app.vocabularies import SimpleVocabulary

import pytest


class TestVocab:
    name: str = "kitconcept.intranet.vocabularies.responsibilities"
    vocab_type = SimpleVocabulary

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_vocabulary):
        self.portal = portal
        self.vocab = get_vocabulary(self.name, portal)

    def test_vocabulary_type(self):
        assert isinstance(self.vocab, self.vocab_type)

    @pytest.mark.parametrize(
        "value",
        [
            "Onboarding",
            "IT-Support",
        ],
    )
    def test_vocab_terms(self, value: str):
        """Vocabulary terms are sourced from the responsibilities catalog index."""
        titles = [term.title for term in self.vocab]
        assert value in titles
