"""Init and utils."""

from kitconcept.keywordmanager import config
from zope.i18nmessageid import MessageFactory

import logging


__version__ = "2.0.0a17"

PACKAGE_NAME = "kitconcept.intranet"

_ = MessageFactory(PACKAGE_NAME)

logger = logging.getLogger(PACKAGE_NAME)

config.IGNORE_INDEXES.extend([
    "location_reference",
    "organisational_unit_reference",
    "roles",
])
