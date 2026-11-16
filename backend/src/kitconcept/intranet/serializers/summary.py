from plone.restapi.interfaces import IJSONSummarySerializerMetadata
from zope.interface import implementer


@implementer(IJSONSummarySerializerMetadata)
class JSONSummarySerializerMetadata:
    """Add additional catalog metadata to serialized items"""

    def default_metadata_fields(self):
        return {
            "job_title",
        }

    def non_metadata_attributes(self):
        """Resolve requested task source titles from their current page."""
        return {"task_source_title", "task_workspace", "task_assignee_details"}
