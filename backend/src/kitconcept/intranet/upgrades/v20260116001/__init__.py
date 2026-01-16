from kitconcept.intranet.utils.batch_process import BatchProcess
from plone import api

import transaction


def add_responsabilities_index(context):
    """Add the Responsabilities KeywordIndex to the catalog."""
    catalog = api.portal.get_tool("portal_catalog")

    # Add the index if it doesn't exist
    if "Responsabilities" not in catalog.indexes():
        catalog.addIndex(
            "Responsabilities",
            "KeywordIndex",
        )
        transaction.commit()

    # Reindex all Person content to populate the new index
    def reindex_responsabilities(obj):
        obj.reindexObject(idxs=["Responsabilities"])

    BatchProcess(
        "Reindex Responsabilities index for Person content",
        BatchProcess.collect_via_catalog(portal_type="Person"),
        reindex_responsabilities,
    ).run()
