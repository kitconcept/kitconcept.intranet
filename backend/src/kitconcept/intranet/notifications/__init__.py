"""Per-user notification center (work item 215, MVP)."""

from .switch import notifications_enabled
from .switch import notifications_paused


__all__ = ["notifications_enabled", "notifications_paused"]
