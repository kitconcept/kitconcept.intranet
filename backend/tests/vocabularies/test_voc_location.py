from kitconcept.intranet.vocabularies.base import CatalogVocabulary
from plone import api
from plone.app.vocabularies import SimpleVocabulary

import pytest


VOCABULARY = "kitconcept.intranet.vocabularies.location"


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
        "token,title", [("97e82b07b5444728b1517de15c79fefb", "Standort Bonn")]
    )
    def test_vocab_terms(self, token: str, title: str):
        term = self.vocab.getTermByToken(token)
        assert term.title == title
        assert term.token == token
        assert term.value == token


class TestLocationsVocabulary:
    """Test the locations vocabulary with dynamically created content."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal

    def test_location_appears_in_vocabulary(self):
        """Test that a created location appears in the vocabulary."""
        with api.env.adopt_roles(["Manager"]):
            api.content.create(
                self.portal,
                "Location",
                id="bonn",
                title="Bonn",
            )

        vocab = api.portal.get_vocabulary(VOCABULARY)
        items = [item.title for item in vocab]
        assert "Bonn" in items

    def test_non_location_not_in_vocabulary(self):
        """Test that non-Location content does not appear in the vocabulary."""
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
            location = api.content.create(
                self.portal,
                "Location",
                id="koeln",
                title="Köln",
            )
            uid = api.content.get_uuid(location)

        vocab = api.portal.get_vocabulary(VOCABULARY)
        tokens = [item.token for item in vocab]
        values = [item.value for item in vocab]
        assert uid in tokens
        assert uid in values
