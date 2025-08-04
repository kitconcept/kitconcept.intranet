from kitconcept.intranet.vocabularies.base import CatalogVocabulary
from plone import api
from plone.app.vocabularies import SimpleVocabulary

import pytest


class TestVocab:
    name: str = "kitconcept.intranet.vocabularies.organisational_unit"
    vocab_type = SimpleVocabulary
    value_type = "uid"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_vocabulary):
        self.portal = portal
        self.vocab = get_vocabulary(self.name, portal)

    def test_vocabulary_type(self):
        assert isinstance(self.vocab, self.vocab_type)

    @pytest.mark.parametrize(
        "token,title",
        [
            (
                "1a22eddf0e7941a0962cbfaa785e4b4d",
                "Institute of Robotics and Mechatronics(Organisational unit)",
            )
        ],
    )
    def test_vocab_terms(self, token: str, title: str):
        term = self.vocab.getTermByToken(token)
        assert term.title == title
        assert term.token == token
        value = token if self.value_type == "uid" else api.content.get(UID=token)
        assert term.value == value


class TestVocabRelation(TestVocab):
    """Test vocabulary used in the organisational unit relation."""

    name: str = "kitconcept.intranet.vocabularies.organisational_unit_objects"
    vocab_type = CatalogVocabulary
    value_type = "object"
