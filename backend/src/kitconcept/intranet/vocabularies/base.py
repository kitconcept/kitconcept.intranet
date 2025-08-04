from plone import api
from plone.dexterity.content import DexterityContent
from plone.uuid.interfaces import IUUID
from zope.schema.vocabulary import SimpleVocabulary


class CatalogVocabulary(SimpleVocabulary):
    """Vocabulary supporting value validation against the Catalog."""

    def __contains__(self, value: DexterityContent | str) -> bool:
        """used during validation to make sure the selected item is found with
        the specified query.

        value can be either a string (hex value of uuid or path) or a plone
        content object.
        """
        if not isinstance(value, str):
            value = IUUID(value)
        if value.startswith("/"):
            # it is a path query
            site_path = "/".join(api.portal.get().getPhysicalPath())
            path = f"{site_path}{value}"
            query = {"path": {"query": path, "depth": 0}}
        else:
            # its a uuid
            query = {"UID": value}
        return bool(api.content.find(**query))
