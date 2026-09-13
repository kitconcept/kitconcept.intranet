from plone import api
from plone.app.vocabularies import SimpleVocabulary

import pytest


VOCABULARY_NAME = "kitconcept.intranet.vocabularies.organisational_unit"


CONTENTS = [
    {
        "type": "Organisational Unit",
        "id": "robotics",
        "title": "Institute of Robotics and Mechatronics(Organisational unit)",
    },
]


@pytest.mark.portal(
    content=CONTENTS,
    roles=["Manager"],
)
class TestVocab:
    name: str = VOCABULARY_NAME
    vocab_type = SimpleVocabulary

    @pytest.fixture(autouse=True)
    def _setup(self, portal_class, clear_cache):
        self.portal = portal_class
        self.content = portal_class["robotics"]
        self.content.reindexObject()
        clear_cache(self.name)

    def test_vocabulary_type(self):
        vocab = api.portal.get_vocabulary(self.name, context=self.portal)
        assert isinstance(vocab, self.vocab_type)

    def test_vocab_terms(self):
        token = api.content.get_uuid(self.content)
        title = self.content.title
        vocab = api.portal.get_vocabulary(self.name, context=self.portal)
        term = vocab.getTermByToken(token)
        assert term.title == title
        assert term.token == token
        assert term.value == token

    def test_unit_appears_in_vocabulary(self, create_content):
        """Test that a created organisational unit appears in the vocabulary."""
        payload = {
            "container": self.portal,
            "type_": "Organisational Unit",
            "id_": "robotics2",
            "title": "Institute of Robotics",
        }
        with create_content(**payload) as content:
            uid = api.content.get_uuid(content)
            vocab = api.portal.get_vocabulary(self.name, context=self.portal)
            term = vocab.getTermByToken(uid)
            assert term.title == content.title

    def test_non_unit_not_in_vocabulary(self, create_content):
        """Test that non-Organisational Unit content does not appear."""
        payload = {
            "container": self.portal,
            "type_": "Document",
            "id_": "another-page",
            "title": "My Page",
        }
        with create_content(**payload) as content, pytest.raises(LookupError) as exc:
            uid: str = api.content.get_uuid(content)
            vocab = api.portal.get_vocabulary(self.name, context=self.portal)
            vocab.getTermByToken(uid)
        assert uid in str(exc.value)

    def test_vocabulary_uses_uid_as_token_and_value(self, create_content):
        """Test that vocabulary terms use UID as both token and value."""
        payload = {
            "container": self.portal,
            "type_": "Organisational Unit",
            "id_": "analytics",
            "title": "Institute of Analytics",
        }
        with create_content(**payload) as content:
            uid = api.content.get_uuid(content)
            vocab = api.portal.get_vocabulary(self.name, context=self.portal)
            term = vocab.getTermByToken(uid)
            assert term.token == uid
            assert term.value == uid
            assert term.title == content.title
