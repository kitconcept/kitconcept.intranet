from AccessControl import getSecurityManager
from plone.autoform.interfaces import READ_PERMISSIONS_KEY
from plone.behavior.registration import lookup_behavior_registration
from plone.behavior.registration import BehaviorRegistrationNotFound
from plone.restapi.serializer.converters import json_compatible
from plone.restapi.interfaces import IExpandableElement
from plone.restapi.interfaces import IFieldSerializer
from plone.restapi.services import Service
from plone.supermodel.utils import mergedTaggedValueDict
from zope.component import adapter
from zope.component import queryMultiAdapter
from zope.component import queryUtility
from zope.interface import implementer
from zope.interface import Interface
from zope.schema import getFields
from zope.security.interfaces import IPermission


@implementer(IExpandableElement)
@adapter(Interface, Interface)
class InheritedBehaviorExpander:

    def __init__(self, context, request):
        self.context = context
        self.request = request
        behavior_names = self.request.form.get("expand.inherit.behaviors")
        self.behavior_names = behavior_names.split(",") if behavior_names else []

    def __call__(self, expand=False):
        result = {}
        for name in self.behavior_names:
            result[name] = {
                "@id": f"{self.context.absolute_url()}/@inherit?expand.inherit.behaviors={name}"
            }
            if expand:
                try:
                    registration = lookup_behavior_registration(name=name)
                except BehaviorRegistrationNotFound:
                    continue
                schema = registration.interface
                closest = next(
                    (
                        obj
                        for obj in self.context.aq_chain
                        if registration.marker.providedBy(obj)
                    ),
                    None,
                )
                if closest:
                    data = SerializeSchemaToJson(self.context, self.request, schema)()
                    result[name].update(
                        {
                            "from": {
                                "@id": closest.absolute_url(),
                                "title": closest.title,
                            },
                            "data": data,
                        }
                    )
        return result


class SerializeSchemaToJson:
    """Serialize fields from a single schema, honoring read permissions."""

    def __init__(self, context, request, schema):
        self.context = context
        self.request = request
        self.schema = schema
        self.permission_cache = {}

    def __call__(self):
        result = {}

        read_permissions = mergedTaggedValueDict(self.schema, READ_PERMISSIONS_KEY)
        for name, field in getFields(self.schema).items():
            if not self.check_permission(read_permissions.get(name)):
                continue
            serializer = queryMultiAdapter(
                (field, self.context, self.request), IFieldSerializer
            )
            value = serializer()
            result[json_compatible(name)] = value

        return result

    def check_permission(self, permission_name):
        if permission_name is None:
            return True

        if permission_name not in self.permission_cache:
            permission = queryUtility(IPermission, name=permission_name)
            if permission is None:
                self.permission_cache[permission_name] = True
            else:
                sm = getSecurityManager()
                self.permission_cache[permission_name] = bool(
                    sm.checkPermission(permission.title, self.context)
                )
        return self.permission_cache[permission_name]


class InheritedBehaviorGet(Service):
    def reply(self):
        expander = InheritedBehaviorExpander(self.context, self.request)
        return expander(expand=True)
