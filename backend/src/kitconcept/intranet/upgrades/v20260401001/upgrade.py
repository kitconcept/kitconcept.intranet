from datetime import date
from kitconcept.intranet.utils.calc_due_date import calc_due_date
from plone import api
from Products.GenericSetup.tool import SetupTool

import logging
import transaction


logger = logging.getLogger("kitconcept.intranet")


def update_existing_content(tool: SetupTool):
    types_we_want = []
    types_tool = api.portal.get_tool("portal_types")
    all_types = types_tool.objectIds()
    for type_id in all_types:
        fti = types_tool[type_id]
        try:
            behaviors = fti.behaviors
            if "kitconcept.intranet.content_review" in behaviors:
                types_we_want.append(type_id)
        except AttributeError:
            continue

    catalog = api.portal.get_tool("portal_catalog")
    indexes = catalog.indexes()
    for idx in ("review_status", "review_due_date"):
        if idx not in indexes:
            catalog.addIndex(idx, "FieldIndex")
            logger.info(f"Added {idx} index")

    brains = api.content.find(portal_type=types_we_want)
    total = len(brains)
    logger.info(f"Found {total} objects to update")
    for idx, brain in enumerate(brains):
        obj = brain.getObject()
        modified = obj.modified().asdatetime().date()
        obj.review_due_date = calc_due_date(base_date=modified)
        review_due_date = obj.review_due_date
        if review_due_date > date.today():
            obj.review_status = "Up-to-date"
        else:
            obj.review_status = "Due"
        obj.reindexObject(idxs=["review_status", "review_due_date"], update_metadata=0)
        if idx % 250 == 0:
            logger.info(f"Updated {idx}/{total} objects")
            transaction.commit()
    logger.info(f"Updated {total}/{total} objects")
    transaction.commit()
