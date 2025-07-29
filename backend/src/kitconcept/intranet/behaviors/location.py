from kitconcept.intranet import _
from plone.autoform.interfaces import IFormFieldProvider
from zope.interface import Interface
from zope.interface import provider
from zope.schema import Choice


@provider(IFormFieldProvider)
class ILocation(Interface):
    """Behavior: Select a Location from a vocabulary."""

    location = Choice(
        title=_("Location"),
        vocabulary="kitconcept.intranet.vocabularies.location",
        required=False,
    )
