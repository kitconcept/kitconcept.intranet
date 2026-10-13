from plone import api
from plone.app.workflow.remap import remap_workflow
from plone.restapi.deserializer import json_body
from plone.restapi.services import Service
from Products.CMFPlone.controlpanel.events import ConfigurationChangedEvent
from zExceptions import BadRequest
from zope.event import notify
from zope.interface import implementer
from zope.publisher.interfaces import IPublishTraverse


@implementer(IPublishTraverse)
class TypeWorkflowGet(Service):
    """@type-workflow endpoint."""

    def __init__(self, context, request):
        super().__init__(context, request)
        self.params = []

    def publishTraverse(self, request, name):
        # Treat any path segments after /@review as parameters
        self.params.append(name)
        return self

    def reply(self):
        if len(self.params) != 1:
            raise BadRequest("Did you forget to provide the type?")
        _type = self.params[0]

        types_tool = api.portal.get_tool("portal_types")
        if types_tool.getTypeInfo(_type) is None:
            self.request.response.setStatus(404)
            return BadRequest("Unknown content type")

        wftool = api.portal.get_tool("portal_workflow")
        default_chain = wftool.getDefaultChain()
        default_wf = wftool.getWorkflowById(default_chain[0]) if default_chain else None
        non_default = [info[0] for info in wftool.listChainOverrides()]
        chain = wftool.getChainForPortalType(_type)

        if _type in non_default:
            if chain:
                wf_id = chain[0]
                wf = getattr(wftool, wf_id)
                return {"title": wf.title, "token": wf_id}
            else:
                return {"title": "", "token": ""}

        if not default_wf:
            return {"title": "", "token": ""}

        return {"title": default_wf.title, "token": default_chain[0]}


@implementer(IPublishTraverse)
class TypeWorkflowPost(Service):
    """@type-workflow endpoint."""

    def __init__(self, context, request):
        super().__init__(context, request)
        self.params = []

    def publishTraverse(self, request, name):
        # Treat any path segments after /@review as parameters
        self.params.append(name)
        return self

    def reply(self):
        if len(self.params) != 1:
            raise BadRequest("Did you forget to provide the type?")
        _type = self.params[0]

        types_tool = api.portal.get_tool("portal_types")
        if types_tool.getTypeInfo(_type) is None:
            self.request.response.setStatus(404)
            return BadRequest("Unknown content type")

        data = json_body(self.request)
        old = data.get("old")
        new = data.get("new")

        if new == old:
            raise BadRequest("Nothing changed.")

        wftool = api.portal.get_tool("portal_workflow")
        chain = () if new == "[none]" else (new,)
        state_map = {s["old_state"]: s["new_state"] for s in []}
        if "[none]" in state_map:
            state_map[None] = state_map["[none]"]
            del state_map["[none]"]
        if _type:
            type_ids = (_type,)
        else:
            types_tool = api.portal.get_tool("portal_types")
            non_default = [info[0] for info in wftool.listChainOverrides()]
            type_ids = [
                _type
                for _type in types_tool.listContentTypes()
                if _type not in non_default
            ]
            wftool.setChainForPortalTypes(type_ids, wftool.getDefaultChain())
            wftool.setDefaultChain(",".join(chain))
            chain = "(Default)"

        remap_workflow(
            self.context, type_ids=type_ids, chain=chain, state_map=state_map
        )

        data = {"workflow": new}
        notify(ConfigurationChangedEvent(self, data))

        return data
