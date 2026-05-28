"""Cache helper functions."""

from kitconcept.intranet.vocabularies.base import get_vocabulary_counter
from plone import api
from plone.memoize.ram import cache as ram  # noQA
from time import time


def vocabulary_key(counter_name: str):
    """Return a function to calculate the vocab cache key

    :param counter: Name of counter that is incremented to invalidate the cache.
    """

    def make_key(_, path: str, language: str) -> str:
        """Return a cache key to cache a vocab for up to 5 minutes

        :param _: Function to be cached.
        :param path: Path of vocab context
        :param language: Language of the vocabulary
        :returns: String cache key
        """
        counter = get_vocabulary_counter(counter_name)
        timechunk = time() // (60 * 5)
        roles = ",".join(api.user.get_roles())
        return f"{counter}-{path}-{language}-{roles}-{timechunk}"

    return make_key


def time_5m_key(*args, **kwargs) -> float:
    """Cache for up to five minutes."""
    return time() // (60 * 5)
