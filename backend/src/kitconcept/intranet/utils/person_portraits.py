from collective.person.behaviors.user import IPloneUser
from io import BytesIO
from plone import api
from Products.CMFPlone.Portal import PloneSite


class PortraitUpload(BytesIO):
    filename: str


def sync_person_portraits(site: PloneSite) -> int:
    """Copy Person images to the portraits of their associated users."""
    membership = api.portal.get_tool("portal_membership")
    memberdata = api.portal.get_tool("portal_memberdata")
    synced = 0

    for brain in api.content.find(context=site, portal_type="Person"):
        person = brain.getObject()
        username = IPloneUser(person).username
        image = getattr(person, "image", None)
        if not username or image is None:
            continue
        if api.user.get(username=username) is None:
            continue

        safe_id = membership._getSafeMemberId(username)
        if memberdata._getPortrait(safe_id) is not None:
            continue

        portrait = PortraitUpload(image.data)
        portrait.filename = str(image.filename)
        with api.env.adopt_roles(["Manager"]):
            membership.changeMemberPortrait(portrait, username)
        synced += 1

    return synced
