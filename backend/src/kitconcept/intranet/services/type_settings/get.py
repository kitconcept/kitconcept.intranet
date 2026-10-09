from plone.base.interfaces import ISearchSchema, ITypesSchema
from plone.registry.interfaces import IRegistry
from Products.CMFPlone.controlpanel.browser.types import VERSION_POLICIES
from zExceptions import BadRequest
from zope.component import getUtility
from zope.interface import implementer
from zope.publisher.interfaces import IPublishTraverse

from plone import api
from plone.restapi.services import Service


@implementer(IPublishTraverse)
class TypeSettingsGet(Service):
    def __init__(self, context, request):
        super().__init__(context, request)
        self.params = []

    def publishTraverse(self, request, name):
        # Treat any path segments after /@types as parameters
        self.params.append(name)
        return self

    @property
    def type_id(self):
        type_id = self.params[0]
        if type_id is None:
            type_id = ""
        return type_id

    @property
    def fti(self):
        type_id = self.type_id
        portal_types = api.portal.get_tool("portal_types")
        return getattr(portal_types, type_id)

    def reply(self):
        if not len(self.params) == 1:
            raise BadRequest("Please provide a `type`.")

        registry = getUtility(IRegistry)
        search_settings = registry.forInterface(ISearchSchema, prefix="plone")
        types_settings = registry.forInterface(ITypesSchema, prefix="plone")

        result = {
            "is_addable": self.fti.getProperty("global_allow", False),
            "is_discussion_allowed": self.fti.getProperty("allow_discussion", False),
            "current_versioning_policy": self.current_versioning_policy(),
            "versioning_policies": self.versioning_policies(),
            "is_searchable": self.type_id not in search_settings.types_not_searched,
            "is_default_page_type": self.type_id
            not in types_settings.default_page_types,
        }

        if self.type_id == "Link":
            result["is_redirect_links_enabled"] = types_settings.redirect_links

        return result

    def versioning_policies(self):
        return VERSION_POLICIES

    def current_versioning_policy(self):
        portal_repository = api.portal.get_tool("portal_repository")
        if self.type_id not in portal_repository.getVersionableContentTypes():
            return "off"
        policy = set(portal_repository.getPolicyMap().get(self.type_id, ()))
        for info in VERSION_POLICIES:
            if set(info["policy"]) == policy:
                return info["id"]
        return None
