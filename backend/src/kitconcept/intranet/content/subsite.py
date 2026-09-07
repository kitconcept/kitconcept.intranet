from plone.dexterity.content import Container
from plone.supermodel.model import Schema
from zope.interface import implementer


class ISubsite(Schema):
    """Subsite content type interface"""


@implementer(ISubsite)
class Subsite(Container):
    """Subsite content type"""
