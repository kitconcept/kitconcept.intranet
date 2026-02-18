from kitconcept.intranet.utils.get_person import get_current_user_person


def _currentUser(context, row):
    """Return the current user's value for the queried field.

    Looks up the Person object for the current user and reads
    the value of row.index (e.g. organisational_unit_reference,
    location_reference) from the catalog brain metadata.
    """
    person = get_current_user_person()
    if person is None:
        return {}
    values = getattr(person, row.index, None)
    if not values:
        return {}
    return {row.index: {"query": list(values)}}
