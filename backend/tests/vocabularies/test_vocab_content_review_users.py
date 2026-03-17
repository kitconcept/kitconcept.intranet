from plone.app.vocabularies import SimpleVocabulary

import pytest


class TestVocab:
    name: str = "kitconcept.intranet.vocabularies.content_review_intervals"
    vocab_type = SimpleVocabulary

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_vocabulary):
        self.portal = portal
        self.vocab = get_vocabulary(self.name, portal)
