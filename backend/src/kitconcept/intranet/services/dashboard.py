from collective.person.behaviors.user import IPloneUser
from plone import api
from plone.dexterity.interfaces import IDexterityFTI
from plone.dexterity.utils import createContentInContainer
from plone.protect.interfaces import IDisableCSRFProtection
from plone.restapi.blocks import iter_block_transform_handlers
from plone.restapi.blocks import visit_blocks
from plone.restapi.interfaces import IBlockFieldSerializationTransformer
from plone.restapi.serializer.converters import json_compatible
from plone.restapi.services import Service
from zExceptions import Unauthorized
from zope.component import getUtility
from zope.interface import alsoProvides

import copy


DASHBOARD_ID = "dashboard"


def is_own_person(person) -> bool:
    """Check if the Person belongs to the current user."""
    user = IPloneUser(person, None)
    user_id = api.user.get_current().getId()
    # Anonymous has no user id and a Person may have no username: never match
    return bool(user and user_id) and user_id == user.username


class DashboardGet(Service):
    """Return the default blocks of the Dashboard content type.

    Used to show the current user's dashboard before it has been created.
    Only the owner can see it, because only the owner can create it.
    """

    def reply(self):
        if not is_own_person(self.context):
            raise Unauthorized("You can only view your own dashboard.")

        schema = getUtility(IDexterityFTI, name="Dashboard").lookupSchema()
        # Copy: the schema default is shared by every new Dashboard
        blocks = copy.deepcopy(schema["blocks"].default or {})
        # Same transforms as the blocks field serializer (e.g. resolveuid
        # links to URLs), with the Person as context since there's no
        # Dashboard yet.
        for block in visit_blocks(self.context, blocks):
            new_block = block.copy()
            for handler in iter_block_transform_handlers(
                self.context, block, IBlockFieldSerializationTransformer
            ):
                new_block = handler(new_block)
            block.clear()
            block.update(new_block)
        return {
            "blocks": json_compatible(blocks),
            "blocks_layout": schema["blocks_layout"].default,
        }


class DashboardPost(Service):
    """Create the dashboard of the current user inside their Person."""

    def reply(self):
        if not is_own_person(self.context):
            raise Unauthorized("You can only create your own dashboard.")

        alsoProvides(self.request, IDisableCSRFProtection)

        dashboard = self.context.get(DASHBOARD_ID)
        if dashboard is None:
            # The user is not allowed to add content to their Person and
            # Dashboard is not an allowed type there, so skip those checks.
            dashboard = createContentInContainer(
                self.context,
                "Dashboard",
                checkConstraints=False,
                id=DASHBOARD_ID,
                title="Dashboard",
            )
            # Don't inherit local roles (e.g. Owner of whoever created the
            # Person): only the user and site administrators may access it.
            dashboard.__ac_local_roles_block__ = True
            dashboard.reindexObjectSecurity()

        self.request.response.setStatus(201)
        return {"@id": dashboard.absolute_url()}
