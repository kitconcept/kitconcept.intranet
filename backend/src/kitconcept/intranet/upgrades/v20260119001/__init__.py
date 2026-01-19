from kitconcept.intranet.utils.batch_process import BatchProcess
from plone import api

import transaction


def add_responsibilities_index(context):
    """Add the responsibilities KeywordIndex to the catalog."""
    catalog = api.portal.get_tool("portal_catalog")

    # Add the index if it doesn't exist
    if "responsibilities" not in catalog.indexes():
        catalog.addIndex(
            "responsibilities",
            "KeywordIndex",
        )
        transaction.commit()

    # Reindex all Person content to populate the new index
    def reindex_responsibilities(obj):
        obj.reindexObject(idxs=["responsibilities"])

    BatchProcess(
        "Reindex Responsibilities index for Person content",
        BatchProcess.collect_via_catalog(portal_type="Person"),
        reindex_responsibilities,
    ).run()
