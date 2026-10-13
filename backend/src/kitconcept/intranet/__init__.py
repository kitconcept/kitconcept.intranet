"""Init and utils."""

from zope.i18nmessageid import MessageFactory

import logging


__version__ = "3.1.0"

PACKAGE_NAME = "kitconcept.intranet"

_ = MessageFactory(PACKAGE_NAME)

logger = logging.getLogger(PACKAGE_NAME)

# Patches import the message factory above, so initialize it before importing.
from kitconcept.intranet.patches import apply_patches  # noqa: E402


apply_patches()
