from plone import api
from plone.app.vocabularies import SimpleVocabulary

import pytest


VOCABULARY = "kitconcept.intranet.vocabularies.location"

CONTENTS = [
    {"type": "Location", "id": "bonn", "title": "Bonn"},
    {"type": "Document", "id": "my-page", "title": "My Page"},
    {"type": "Location", "id": "koeln", "title": "Köln"},
]


@pytest.mark.portal(
    content=CONTENTS,
    roles=["Manager"],
)
class TestLocationsVocabulary:
    """Test the locations vocabulary with dynamically created content."""

    vocab_type = SimpleVocabulary

    @pytest.fixture(autouse=True)
    def _setup(self, portal_class):
        self.portal = portal_class
        for item in CONTENTS:
            content = self.portal[item["id"]]
            content.reindexObject()

    def test_vocabulary_type(self):
        vocab = api.portal.get_vocabulary(VOCABULARY)
        assert isinstance(vocab, self.vocab_type)

    def test_location_appears_in_vocabulary(self):
        """Test that a created location appears in the vocabulary."""
        vocab = api.portal.get_vocabulary(VOCABULARY)
        items = [item.title for item in vocab]
        assert "Bonn" in items

    def test_non_location_not_in_vocabulary(self):
        """Test that non-Location content does not appear in the vocabulary."""
        vocab = api.portal.get_vocabulary(VOCABULARY)
        items = [item.title for item in vocab]
        assert "My Page" not in items

    def test_vocabulary_uses_uid_as_token_and_value(self):
        """Test that vocabulary terms use UID as both token and value."""
        uid = api.content.get_uuid(self.portal["koeln"])

        vocab = api.portal.get_vocabulary(VOCABULARY)
        term = vocab.getTermByToken(uid)
        assert term.value == uid
        assert term.token == uid
