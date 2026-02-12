from plone import api


def _currentUser(context, row):
    """Return the current user's value for the queried field.

    Looks up the Person object for the current user and reads
    the value of row.index (e.g. organisational_unit_reference,
    location_reference) from the catalog brain metadata.
    """
    user = api.user.get_current()
    if user is None:
        return {}
    brains = api.content.find(type="Person", username=user.getId(), unrestricted=True)
    if len(brains) != 1:
        return {}
    person = brains[0]
    values = getattr(person, row.index, None)
    if not values:
        return {}
    return {row.index: {"query": list(values)}}
