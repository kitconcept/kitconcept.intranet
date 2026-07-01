from plone.app.vocabularies import SimpleVocabulary

import pytest


CONTENTS = [
    {
        "type": "Person",
        "id": "john-doe",
        "first_name": "John",
        "last_name": "Doe",
        "academic_title": "",
        "responsibilities": ["Onboarding", "IT-Support"],
    },
    {
        "type": "Person",
        "id": "jane-doe",
        "first_name": "Jane",
        "last_name": "Doe",
        "academic_title": "Dr.",
        "responsibilities": ["IT-Support"],
    },
]


@pytest.mark.portal(
    content=CONTENTS,
    roles=["Manager"],
)
class TestVocab:
    name: str = "kitconcept.intranet.vocabularies.responsibilities"
    vocab_type = SimpleVocabulary

    @pytest.fixture(autouse=True)
    def _setup(self, portal_class, get_vocabulary):
        self.portal = portal_class
        self.vocab = get_vocabulary(self.name, self.portal)

    def test_vocabulary_type(self):
        assert isinstance(self.vocab, self.vocab_type)

    @pytest.mark.parametrize(
        "value",
        [
            "Onboarding",
            "IT-Support",
        ],
    )
    def test_vocab_terms(self, value: str):
        """Vocabulary terms are sourced from the responsibilities catalog index."""
        titles = [term.title for term in self.vocab]
        assert value in titles
