from datetime import date
from dateutil.relativedelta import relativedelta
from plone import api


def calc_due_date(base_date: date | None = None, interval: str | None = None) -> date:
    if not interval:
        interval = api.portal.get_registry_record(
            "kitconcept.intranet.content_review_default_interval"
        )
    if not base_date:
        base_date = date.today()
    mapping = {
        "d": "days",
        "w": "weeks",
        "m": "months",
        "y": "years",
    }
    unit = mapping.get(interval[-1])
    amount = int(interval[:-1])
    return base_date + relativedelta(**{unit: amount})
