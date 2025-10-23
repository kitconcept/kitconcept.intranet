from plone.restapi.interfaces import IJSONSummarySerializerMetadata
from zope.interface import implementer


@implementer(IJSONSummarySerializerMetadata)
class JSONSummarySerializerMetadata:
    """Add additional catalog metadata to serialized items"""

    def default_metadata_fields(self):
        return {
            "job_title",
        }
