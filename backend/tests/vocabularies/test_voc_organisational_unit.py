from plone import api
from plone.app.vocabularies import SimpleVocabulary

import pytest


VOCABULARY = "kitconcept.intranet.vocabularies.organisational_unit"


class TestVocab:
    name: str = VOCABULARY
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
        assert term.value == token


class TestOrganisationalUnitVocabulary:
    """Test the organisational unit vocabulary with dynamically created content."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal

    def test_unit_appears_in_vocabulary(self):
        """Test that a created organisational unit appears in the vocabulary."""
        with api.env.adopt_roles(["Manager"]):
            api.content.create(
                self.portal,
                "Organisational Unit",
                id="robotics",
                title="Institute of Robotics",
            )

        vocab = api.portal.get_vocabulary(VOCABULARY)
        items = [item.title for item in vocab]
        assert "Institute of Robotics" in items

    def test_non_unit_not_in_vocabulary(self):
        """Test that non-Organisational Unit content does not appear."""
        with api.env.adopt_roles(["Manager"]):
            api.content.create(
                self.portal,
                "Document",
                id="my-page",
                title="My Page",
            )

        vocab = api.portal.get_vocabulary(VOCABULARY)
        items = [item.title for item in vocab]
        assert "My Page" not in items

    def test_vocabulary_uses_uid_as_token_and_value(self):
        """Test that vocabulary terms use UID as both token and value."""
        with api.env.adopt_roles(["Manager"]):
            unit = api.content.create(
                self.portal,
                "Organisational Unit",
                id="analytics",
                title="Institute of Analytics",
            )
            uid = api.content.get_uuid(unit)

        vocab = api.portal.get_vocabulary(VOCABULARY)
        tokens = [item.token for item in vocab]
        values = [item.value for item in vocab]
        assert uid in tokens
        assert uid in values
