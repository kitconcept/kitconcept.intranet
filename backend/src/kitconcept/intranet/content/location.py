from plone.dexterity.content import Container
from plone.supermodel.model import Schema
from zope.interface import implementer


class ILocation(Schema):
    """Location content type interface"""


@implementer(ILocation)
class Location(Container):
    """Location content type"""
