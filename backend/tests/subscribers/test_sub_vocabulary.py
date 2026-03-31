from kitconcept.intranet.subscribers.vocabulary import cache_buster
from kitconcept.intranet.subscribers.vocabulary import KEYS
from kitconcept.intranet.vocabularies.base import get_vocabulary_counter
from plone import api
from zope.lifecycleevent import ObjectModifiedEvent

import pytest


class TestCacheBuster:
    """Test the vocabulary cache buster subscriber."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal
        # Clean up any previous _vocab_cache
        if hasattr(self.portal, "_vocab_cache"):
            delattr(self.portal, "_vocab_cache")

    def test_keys_mapping(self):
        """Test that KEYS maps the correct portal types."""
        assert "Location" in KEYS
        assert "Organisational Unit" in KEYS
        assert KEYS["Location"] == "kitconcept.intranet.vocabularies.location"
        assert (
            KEYS["Organisational Unit"]
            == "kitconcept.intranet.vocabularies.organisational_unit"
        )

    def test_cache_buster_location(self):
        """Test that modifying a Location invalidates its vocabulary cache."""
        key = "kitconcept.intranet.vocabularies.location"
        with api.env.adopt_roles(["Manager"]):
            location = api.content.create(
                self.portal,
                "Location",
                id="test-cache-loc",
                title="Test Cache Location",
            )

        # Counter was already incremented by the ZCML subscriber on create
        counter_after_create = get_vocabulary_counter(key)
        assert counter_after_create > 0

        # Explicitly calling cache_buster should increment further
        event = ObjectModifiedEvent(location)
        cache_buster(location, event)
        assert get_vocabulary_counter(key) == counter_after_create + 1

        # Clean up
        with api.env.adopt_roles(["Manager"]):
            api.content.delete(location)

    def test_cache_buster_organisational_unit(self):
        """Test that modifying an Organisational Unit invalidates its vocabulary cache."""
        key = "kitconcept.intranet.vocabularies.organisational_unit"
        with api.env.adopt_roles(["Manager"]):
            ou = api.content.create(
                self.portal,
                "Organisational Unit",
                id="test-cache-ou",
                title="Test Cache OU",
            )

        counter_after_create = get_vocabulary_counter(key)
        assert counter_after_create > 0

        event = ObjectModifiedEvent(ou)
        cache_buster(ou, event)
        assert get_vocabulary_counter(key) == counter_after_create + 1

        # Clean up
        with api.env.adopt_roles(["Manager"]):
            api.content.delete(ou)

    def test_cache_buster_increments(self):
        """Test that multiple modifications increment the counter."""
        key = "kitconcept.intranet.vocabularies.location"
        with api.env.adopt_roles(["Manager"]):
            location = api.content.create(
                self.portal,
                "Location",
                id="test-incr-loc",
                title="Test Increment Location",
            )

        counter_after_create = get_vocabulary_counter(key)
        event = ObjectModifiedEvent(location)
        cache_buster(location, event)
        cache_buster(location, event)
        assert get_vocabulary_counter(key) == counter_after_create + 2

        # Clean up
        with api.env.adopt_roles(["Manager"]):
            api.content.delete(location)

    def test_cache_buster_ignores_unrelated_types(self):
        """Test that modifying unrelated content types does not invalidate cache."""
        loc_key = "kitconcept.intranet.vocabularies.location"
        ou_key = "kitconcept.intranet.vocabularies.organisational_unit"
        loc_before = get_vocabulary_counter(loc_key)
        ou_before = get_vocabulary_counter(ou_key)

        with api.env.adopt_roles(["Manager"]):
            doc = api.content.create(
                self.portal,
                "Document",
                id="test-doc",
                title="Test Document",
            )

        # Counters should not have changed
        assert get_vocabulary_counter(loc_key) == loc_before
        assert get_vocabulary_counter(ou_key) == ou_before

        # Explicitly calling cache_buster on a Document should also be a no-op
        event = ObjectModifiedEvent(doc)
        cache_buster(doc, event)
        assert get_vocabulary_counter(loc_key) == loc_before
        assert get_vocabulary_counter(ou_key) == ou_before

        # Clean up
        with api.env.adopt_roles(["Manager"]):
            api.content.delete(doc)

    def test_subscriber_fires_on_create(self):
        """Test that the ZCML subscriber fires automatically on content creation."""
        key = "kitconcept.intranet.vocabularies.location"
        counter_before = get_vocabulary_counter(key)

        with api.env.adopt_roles(["Manager"]):
            location = api.content.create(
                self.portal,
                "Location",
                id="test-auto-loc",
                title="Test Auto Location",
            )

        assert get_vocabulary_counter(key) > counter_before

        # Clean up
        with api.env.adopt_roles(["Manager"]):
            api.content.delete(location)
