from kitconcept.intranet.vocabularies.base import VocabularyCounter
from kitconcept.intranet.vocabularies.base import get_vocabulary_counter
from kitconcept.intranet.vocabularies.base import invalidate_vocabulary_cache
from plone import api

import pytest


class TestVocabularyCounter:
    """Test VocabularyCounter cache invalidation mechanism."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal_class):
        self.portal = portal_class
        # Clean up any previous _vocab_cache
        if hasattr(self.portal, "_vocab_cache"):
            delattr(self.portal, "_vocab_cache")

    def test_initial_counter_value(self):
        counter = VocabularyCounter()
        assert counter.get("test.vocab") == 0

    def test_invalidate_increments_counter(self):
        counter = VocabularyCounter()
        counter.invalidate("test.vocab")
        assert counter.get("test.vocab") == 1

    def test_invalidate_increments_multiple_times(self):
        counter = VocabularyCounter()
        counter.invalidate("test.vocab")
        counter.invalidate("test.vocab")
        counter.invalidate("test.vocab")
        assert counter.get("test.vocab") == 3

    def test_independent_counters(self):
        counter = VocabularyCounter()
        counter.invalidate("vocab.a")
        counter.invalidate("vocab.a")
        counter.invalidate("vocab.b")
        assert counter.get("vocab.a") == 2
        assert counter.get("vocab.b") == 1

    def test_get_vocabulary_counter_helper(self):
        invalidate_vocabulary_cache("test.helper")
        assert get_vocabulary_counter("test.helper") == 1

    def test_cache_persists_on_portal(self):
        counter = VocabularyCounter()
        counter.invalidate("test.persist")
        assert hasattr(self.portal, "_vocab_cache")
        # A new VocabularyCounter instance should see the same value
        counter2 = VocabularyCounter()
        assert counter2.get("test.persist") == 1


class TestGetTranslatedVocabulary:
    """Test get_translated_vocabulary function."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal_class):
        self.portal = portal_class

    def test_vocabulary_from_content(self, create_content):
        """Test that get_translated_vocabulary returns items from the catalog."""
        from kitconcept.intranet.vocabularies.base import get_translated_vocabulary

        payload = {
            "container": self.portal,
            "type_": "Location",
            "id_": "test-loc",
            "title": "Test Location",
        }
        with create_content(**payload) as content:
            uid = api.content.get_uuid(content)
            params = (("portal_type", "Location"),)
            vocab = get_translated_vocabulary(params, "de")
            tokens = [term.token for term in vocab]
            assert uid in tokens

    def test_vocabulary_terms_use_uid_as_token_and_value(self, create_content):
        """Test that vocabulary terms use UID as both token and value."""
        from kitconcept.intranet.vocabularies.base import get_translated_vocabulary

        payload = {
            "container": self.portal,
            "type_": "Location",
            "id_": "test-uid-loc",
            "title": "Test UID Location",
        }
        with create_content(**payload) as content:
            uid = api.content.get_uuid(content)
            params = (("portal_type", "Location"),)
            vocab = get_translated_vocabulary(params, "de")
            term = vocab.getTermByToken(uid)
            assert term.value == uid
            assert term.token == uid

    def test_vocabulary_sorted_by_title(self, create_content):
        """Test that vocabulary terms are sorted by title."""
        from kitconcept.intranet.vocabularies.base import get_translated_vocabulary

        items = [
            {
                "container": self.portal,
                "type_": "Location",
                "id_": "loc-c",
                "title": "Charlie",
            },
            {
                "container": self.portal,
                "type_": "Location",
                "id_": "loc-a",
                "title": "Alpha",
            },
            {
                "container": self.portal,
                "type_": "Location",
                "id_": "loc-b",
                "title": "Bravo",
            },
        ]

        with (
            create_content(**items[0]),
            create_content(**items[1]),
            create_content(**items[2]),
        ):
            params = (("portal_type", "Location"),)
            vocab = get_translated_vocabulary(params, "de")
            titles = [term.title for term in vocab]
            assert (
                titles.index("Alpha") < titles.index("Bravo") < titles.index("Charlie")
            )
