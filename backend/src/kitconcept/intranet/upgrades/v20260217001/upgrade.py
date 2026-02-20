from kitconcept.intranet.behaviors.content_review import IContentReview
from plone import api

import logging
import transaction


logger = logging.getLogger("kitconcept.intranet")


def add_review_status_indexer(context):
    catalog = api.portal.get_tool("portal_catalog")
    indexes = catalog.indexes()
    if "review_status" not in indexes:
        catalog.addIndex("review_status", "FieldIndex")
        logger.info("Added review_status index.")
    brains = catalog(object_provides=IContentReview)
    total = len(brains)
    for index, brain in enumerate(brains):
        obj = brain.getObject()
        obj.reindexObject(idxs=["review_status"], update_metadata=0)
        logger.info(f"Reindexing object {brain.getPath()}.")
        if index % 250 == 0:
            logger.info(f"Reindexed {index}/{total} objects.")
            transaction.commit()
    transaction.commit()


def add_review_due_date_indexer(context):
    catalog = api.portal.get_tool("portal_catalog")
    indexes = catalog.indexes()
    if "review_due_date" not in indexes:
        catalog.addIndex("review_due_date", "FieldIndex")
        logger.info("Added review_due_date index.")
    brains = catalog(object_provides=IContentReview)
    total = len(brains)
    for index, brain in enumerate(brains):
        obj = brain.getObject()
        obj.reindexObject(idxs=["review_status"], update_metadata=0)
        logger.info(f"Reindexing object {brain.getPath()}.")
        if index % 250 == 0:
            logger.info(f"Reindexed {index}/{total} objects.")
            transaction.commit()
    transaction.commit()
