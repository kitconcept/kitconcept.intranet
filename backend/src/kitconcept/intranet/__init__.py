"""Init and utils."""

from kitconcept.intranet.patches import apply_patches
from zope.i18nmessageid import MessageFactory

import logging

__version__ = "3.5.0"

PACKAGE_NAME = "kitconcept.intranet"

_ = MessageFactory(PACKAGE_NAME)

logger = logging.getLogger(PACKAGE_NAME)

apply_patches()
