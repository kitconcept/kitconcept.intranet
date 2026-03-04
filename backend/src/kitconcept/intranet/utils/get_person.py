from plone import api


def get_current_user_person():
    """Return the catalog brain of the Person object for the current user.

    Returns None if the user is not authenticated or has no associated Person.
    """
    user = api.user.get_current()
    if user is None:
        return None
    brains = api.content.find(type="Person", username=user.getId(), unrestricted=True)
    if len(brains) != 1:
        return None
    return brains[0]
