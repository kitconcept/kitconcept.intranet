from .model import IInlineTask
from plone.app.linkintegrity.browser.info import DeleteConfirmationInfo


class TaskAwareDeleteConfirmationInfo(DeleteConfirmationInfo):
    """Check pages normally while skipping cataloged fragments without intids."""

    def check_object(self, obj, excluded_path=None, excluded_paths=None):
        # Page deletion queries catalog descendants even without task delete events.
        # Tasks have no intid; relations target their containing page instead.
        if IInlineTask.providedBy(obj):
            return None
        return super().check_object(obj, excluded_path, excluded_paths)
