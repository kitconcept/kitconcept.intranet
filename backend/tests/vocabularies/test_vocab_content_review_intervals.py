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

    @pytest.mark.parametrize(
        "token,title",
        [
            ("2w", "Every 2 weeks"),
            ("1m", "Every month"),
            ("6m", "Every 6 months"),
            ("1y", "Every year"),
        ],
    )
    def test_vocab_terms(self, token: str, title: str):
        term = self.vocab.getTermByToken(token)
        assert term.title == title
        assert term.token == token
