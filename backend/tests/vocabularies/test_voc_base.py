from kitconcept.intranet.vocabularies.base import get_vocabulary_counter
from kitconcept.intranet.vocabularies.base import invalidate_vocabulary_cache
from kitconcept.intranet.vocabularies.base import VocabularyCounter
from plone import api

import pytest


class TestVocabularyCounter:
    """Test VocabularyCounter cache invalidation mechanism."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal
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
    def _setup(self, portal):
        self.portal = portal

    def test_vocabulary_from_content(self):
        """Test that get_translated_vocabulary returns items from the catalog."""
        from kitconcept.intranet.vocabularies.base import get_translated_vocabulary

        with api.env.adopt_roles(["Manager"]):
            location = api.content.create(
                self.portal,
                "Location",
                id="test-loc",
                title="Test Location",
            )
            uid = api.content.get_uuid(location)

        params = (("portal_type", "Location"),)
        vocab = get_translated_vocabulary(params, "de")
        tokens = [term.token for term in vocab]
        assert uid in tokens

        # Clean up
        with api.env.adopt_roles(["Manager"]):
            api.content.delete(location)

    def test_vocabulary_terms_use_uid_as_token_and_value(self):
        """Test that vocabulary terms use UID as both token and value."""
        from kitconcept.intranet.vocabularies.base import get_translated_vocabulary

        with api.env.adopt_roles(["Manager"]):
            location = api.content.create(
                self.portal,
                "Location",
                id="test-uid-loc",
                title="Test UID Location",
            )
            uid = api.content.get_uuid(location)

        params = (("portal_type", "Location"),)
        vocab = get_translated_vocabulary(params, "de")
        term = vocab.getTermByToken(uid)
        assert term.value == uid
        assert term.token == uid

        # Clean up
        with api.env.adopt_roles(["Manager"]):
            api.content.delete(location)

    def test_vocabulary_sorted_by_title(self):
        """Test that vocabulary terms are sorted by title."""
        from kitconcept.intranet.vocabularies.base import get_translated_vocabulary

        with api.env.adopt_roles(["Manager"]):
            loc_c = api.content.create(
                self.portal, "Location", id="loc-c", title="Charlie"
            )
            loc_a = api.content.create(
                self.portal, "Location", id="loc-a", title="Alpha"
            )
            loc_b = api.content.create(
                self.portal, "Location", id="loc-b", title="Bravo"
            )

        params = (("portal_type", "Location"),)
        vocab = get_translated_vocabulary(params, "de")
        titles = [term.title for term in vocab]
        assert titles.index("Alpha") < titles.index("Bravo") < titles.index("Charlie")

        # Clean up
        with api.env.adopt_roles(["Manager"]):
            api.content.delete(loc_a)
            api.content.delete(loc_b)
            api.content.delete(loc_c)
