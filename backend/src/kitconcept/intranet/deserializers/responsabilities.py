from base64 import b64encode
from plone.dexterity.interfaces import IDexterityContent
from plone.restapi.deserializer.dxfields import DefaultFieldDeserializer
from plone.restapi.interfaces import IFieldDeserializer
from zope.component import adapter
from zope.component import queryUtility
from zope.interface import Interface
from zope.interface import implementer
from zope.publisher.interfaces.browser import IBrowserRequest
from zope.schema.interfaces import IVocabularyFactory


class IResponsabilitiesField(Interface):
    """Marker interface for the responsabilities field."""


def _decode_token(token: str, vocabulary=None) -> str:
    """Decode a vocabulary token to its original value.

    First tries to look up the token in the vocabulary.
    Falls back to base64 decoding for new items.
    """
    # Try vocabulary lookup first
    if vocabulary is not None:
        try:
            term = vocabulary.getTermByToken(token)
            return term.value
        except LookupError:
            pass

    # Fall back to base64 decoding for new items
    try:
        decoded = b64encode(token).decode("utf-8")
        # Verify the decoded value looks like valid text
        if decoded.isprintable() or " " in decoded:
            return decoded
    except Exception:
        pass

    # Return as-is if neither method works
    return token


@implementer(IFieldDeserializer)
@adapter(IResponsabilitiesField, IDexterityContent, IBrowserRequest)
class ResponsabilitiesFieldDeserializer(DefaultFieldDeserializer):
    """Custom deserializer for the responsabilities field.

    Decodes vocabulary tokens back to their original string values.
    """

    def __call__(self, value):
        if value is None:
            return
        if not isinstance(value, list):
            value = [value]

        # Get vocabulary for token lookup
        vocabulary = None
        vocab_factory = queryUtility(
            IVocabularyFactory,
            name="kitconcept.intranet.vocabularies.responsabilities",
        )
        if vocab_factory is not None:
            try:
                vocabulary = vocab_factory(self.context)
            except Exception:
                pass

        # Decode tokens to values
        decoded_values = []
        for v in value:
            if isinstance(v, dict) and "token" in v:
                v = v["token"]
            if isinstance(v, str):
                v = _decode_token(v, vocabulary)
            decoded_values.append(v)

        value = self.field._type(decoded_values)
        self.field.validate(value)
        return value
