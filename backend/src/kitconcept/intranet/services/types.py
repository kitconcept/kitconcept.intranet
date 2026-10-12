from plone import api
from plone.registry.interfaces import IRegistry
from plone.restapi.services.types.get import TypesGet as BaseService
from plone.restapi.services.types.get import TypesInfo
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
            if fieldset["id"] == "Content Review & Reminders":
                review_enabled = registry.get(
                    "kitconcept.intranet.enable_content_review", False
                )
                if not review_enabled:
                    continue
            fieldsets.append(fieldset)

        response["fieldsets"] = fieldsets
        return response


orig_call = TypesInfo.__call__


def patched__call__(self, expand=False):
    portal_types = api.portal.get_tool("portal_types")
    result = orig_call(self, expand=expand)["types"]
    if isinstance(result, list):
        for info in result:
            fti = portal_types[info["id"]]
            restrict_to_path = getattr(fti, "restrict_to_path", None)
            current_path = "/".join(self.context.getPhysicalPath())
            if restrict_to_path and not current_path.startswith(restrict_to_path):
                info["addable"] = False
                info["immediately_addable"] = False
    return {"types": result}


TypesInfo.__call__ = patched__call__
