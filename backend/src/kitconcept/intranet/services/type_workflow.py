from plone import api
from plone.app.workflow.remap import remap_workflow
from plone.base.utils import safe_text
from plone.restapi.deserializer import json_body
from plone.restapi.services import Service
from Products.CMFPlone.controlpanel.events import ConfigurationChangedEvent
from zExceptions import BadRequest
from zExceptions import NotFound
from zope.event import notify
from zope.i18n import translate
from zope.interface import implementer
from zope.publisher.interfaces import IPublishTraverse


NO_WORKFLOW = "[none]"


class TypeWorkflowBase(Service):
    """Base class for the @type-workflow endpoints."""

    def __init__(self, context, request):
        super().__init__(context, request)
        self.params = []

    def publishTraverse(self, request, name):
        # Treat any path segments after /@type-workflow as parameters
        self.params.append(name)
        return self

    @property
    def wftool(self):
        return api.portal.get_tool("portal_workflow")

    def get_type(self) -> str:
        """Return the portal type passed as path parameter, or raise."""
        if len(self.params) != 1:
            raise BadRequest("Did you forget to provide the type?")
        portal_type = self.params[0]
        types_tool = api.portal.get_tool("portal_types")
        if types_tool.getTypeInfo(portal_type) is None:
            raise NotFound("Unknown content type")
        return portal_type

    def current_workflow(self, portal_type: str) -> str:
        """Return the id of the first workflow in the chain of the type,
        or NO_WORKFLOW if the type has no workflow."""
        chain = self.wftool.getChainForPortalType(portal_type)
        return chain[0] if chain else NO_WORKFLOW


@implementer(IPublishTraverse)
class TypeWorkflowGet(TypeWorkflowBase):
    """GET @type-workflow[/<portal_type>]"""

    def translate(self, msg) -> str:
        return translate(safe_text(msg), domain="plone", context=self.request)

    def reply(self):
        wftool = self.wftool
        workflows = []
        for wf in wftool.values():
            states = [
                {"id": state.id, "title": self.translate(state.title)}
                for state in wf.states.objectValues()
            ]
            workflows.append({
                "title": self.translate(wf.title),
                "token": wf.id,
                "initial_state": wf.initial_state,
                "states": states,
            })
        default_chain = wftool.getDefaultChain()
        result = {
            "default": default_chain[0] if default_chain else NO_WORKFLOW,
            "workflows": workflows,
        }

        if self.params:
            portal_type = self.get_type()
            overridden = [info[0] for info in wftool.listChainOverrides()]
            result["current"] = {
                "uses_default": portal_type not in overridden,
                "workflow": self.current_workflow(portal_type),
            }

        return result


@implementer(IPublishTraverse)
class TypeWorkflowPatch(TypeWorkflowBase):
    """PATCH @type-workflow/<portal_type>

    Body: {"new": <workflow id or "[none]">,
           "old": <optional, workflow id the client expects to replace>,
           "stateMap": {<old state id or "[none]">: <new state id>}}
    """

    def validate_state_map(self, state_map, new: str) -> dict:
        if state_map is None:
            return {}
        if not isinstance(state_map, dict):
            raise BadRequest("'stateMap' must be an object.")
        if new == NO_WORKFLOW:
            return {}
        valid_states = set(self.wftool[new].states.objectIds())
        result = {}
        for old_state, new_state in state_map.items():
            if new_state not in valid_states:
                raise BadRequest(f"Unknown state '{new_state}' for workflow '{new}'.")
            # Objects without a workflow state are remapped using the None key
            result[None if old_state == NO_WORKFLOW else old_state] = new_state
        return result

    def reply(self):
        portal_type = self.get_type()

        data = json_body(self.request)
        new = data.get("new")
        if not new:
            raise BadRequest("Missing parameter 'new'.")
        if new != NO_WORKFLOW and new not in self.wftool.getWorkflowIds():
            raise BadRequest(f"Unknown workflow '{new}'.")

        current = self.current_workflow(portal_type)
        old = data.get("old")
        if old and old != current:
            raise BadRequest(
                "The workflow of this type was changed in the meantime. "
                "Please reload and try again."
            )
        if new == current:
            raise BadRequest("Nothing changed.")

        state_map = self.validate_state_map(data.get("stateMap"), new)
        chain = () if new == NO_WORKFLOW else (new,)
        remap_workflow(
            self.context, type_ids=(portal_type,), chain=chain, state_map=state_map
        )

        data = {"workflow": new}
        notify(ConfigurationChangedEvent(self, data))

        return data
