from collections.abc import Generator
from contextlib import contextmanager
from plone import api
from plone.dexterity.content import DexterityContent

import pytest


@pytest.fixture(scope="function")
def clear_cache():
    """Fixture to clear the global cache before each test."""

    def _clear_cache(vocab_name: str):
        """Clear the global cache for a specific function."""
        from kitconcept.intranet.vocabularies.base import invalidate_vocabulary_cache

        invalidate_vocabulary_cache(vocab_name)

    return _clear_cache


@pytest.fixture(scope="function")
def create_content():
    """Fixture to create content in the portal for testing."""

    @contextmanager
    def _create_content(container, type_, id_, title) -> Generator[DexterityContent]:
        with api.env.adopt_roles(["Manager"]):
            content = api.content.create(
                container=container,
                type=type_,
                id=id_,
                title=title,
            )
        yield content
        with api.env.adopt_roles(["Manager"]):
            api.content.delete(content)

    return _create_content
