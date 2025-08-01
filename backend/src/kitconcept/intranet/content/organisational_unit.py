from plone.dexterity.content import Container
from plone.supermodel.model import Schema
from zope.interface import implementer


class IOrganisationalUnit(Schema):
    """Organisational Unit content type interface"""


@implementer(IOrganisationalUnit)
class OrganisationalUnit(Container):
    """Organisational Unit content type"""
