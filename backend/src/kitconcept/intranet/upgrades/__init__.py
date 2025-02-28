from plone.dexterity.interfaces import IDexterityFTI
from zope.component import queryUtility


def add_behavior(portal_type, behavior):
    fti = queryUtility(IDexterityFTI, name=portal_type)
    new = [
        currentbehavior
        for currentbehavior in fti.behaviors
        if currentbehavior != behavior
    ]
    new.append(behavior)
    fti.behaviors = tuple(new)


def prepend_behavior(portal_type, behavior):
    fti = queryUtility(IDexterityFTI, name=portal_type)
    new = [
        currentbehavior
        for currentbehavior in fti.behaviors
        if currentbehavior != behavior
    ]
    new.insert(0, behavior)
    fti.behaviors = tuple(new)


def remove_behavior(portal_type, behavior):
    fti = queryUtility(IDexterityFTI, name=portal_type)
    if fti is not None:
        new = [
            currentbehavior
            for currentbehavior in fti.behaviors
            if currentbehavior != behavior
        ]
        fti.behaviors = tuple(new)


def remove_preview_image_behavior(context):
    REMOVE_PREVIEW_IMAGE_BEHAVIOR = ["Document", "News Item", "Event"]
    for type_ in REMOVE_PREVIEW_IMAGE_BEHAVIOR:
        remove_behavior(type_, "volto.preview_image")

    # Remove leadimage behavior from News Item
    remove_behavior("News Item", "plone.leadimage")
