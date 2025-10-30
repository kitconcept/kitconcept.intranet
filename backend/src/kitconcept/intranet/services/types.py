from plone.registry.interfaces import IRegistry
from plone.restapi.services.types.get import TypesGet as BaseService
from zope.component import getUtility
from zope.interface import implementer
from zope.publisher.interfaces import IPublishTraverse


@implementer(IPublishTraverse)
class TypesGet(BaseService):
    """Override @types service to include some fields conditionally."""

    def reply_for_type(self):
        # get response from base service
        registry = getUtility(IRegistry)
        response = super().reply_for_type()

        # Skip 'likes' fieldset if rating is disabled site-wide
        fieldsets = []
        for fieldset in response.get("fieldsets", []):
            if fieldset["id"] == "likes":
                rating_enabled = registry.get(
                    "kitconcept.intranet.enable_content_rating", True
                )
                if not rating_enabled:
                    continue
            fieldsets.append(fieldset)

        response["fieldsets"] = fieldsets
        return response
