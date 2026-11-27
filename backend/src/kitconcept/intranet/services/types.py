from plone.registry.interfaces import IRegistry
from plone.restapi.services.types.get import TypesGet as BaseService
from plone.restapi.services.types.update import TypesUpdate as BaseTypesUpdate
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


class TypesUpdate(BaseTypesUpdate):
    """Override @types PATCH to ignore the `selected` key.

    The Layout editor in the Volto types control panel sends the selected
    block id along with blocks and blocks_layout. plone.restapi would try to
    create a `selected` field, fail with a 400 and roll back the whole save.
    """

    def reply_for_field(self, name, field_name, data, create=False):
        if create and field_name == "selected":
            return self.reply_no_content()
        return super().reply_for_field(name, field_name, data, create=create)
