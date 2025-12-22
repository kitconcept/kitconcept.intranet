from kitconcept.intranet.utils.batch_process import BatchProcess
from plone import api
from z3c.relationfield.interfaces import IRelationValue
from zc.relation.interfaces import ICatalog
from zope.component import getUtility

import transaction


def make_relation_catalog_collector(attr):
    """Creates a batch collector which finds content via the relation catalog"""

    def collector():
        relation_catalog = getUtility(ICatalog)
        relations = relation_catalog.findRelations({"from_attribute": attr})
        for relation in relations:
            try:
                yield relation.from_object
            except Exception:  # noqa
                continue

    return collector


def migrate_relationchoice_to_relationlist(attr):
    def migrate_obj(obj):
        value = getattr(obj, attr, None)
        if IRelationValue.providedBy(value):
            setattr(obj, attr, [value])

    return migrate_obj


def migrate_relation_fields(context):
    """Migrate location and organisational unit fields to support multiple values."""

    BatchProcess(
        "Update location_reference",
        make_relation_catalog_collector("location_reference"),
        migrate_relationchoice_to_relationlist("location_reference"),
    ).run()

    BatchProcess(
        "Update organisational_unit_reference",
        make_relation_catalog_collector("organisational_unit_reference"),
        migrate_relationchoice_to_relationlist("organisational_unit_reference"),
    ).run()


def migrate_relation_indexes(context):
    """Convert location and organisational_unit indexes to KeywordIndex."""
    catalog = api.portal.get_tool("portal_catalog")
    catalog.delIndex("location_reference")
    catalog.addIndex(
        "location_reference",
        "KeywordIndex",
    )
    catalog.delIndex("organisational_unit_reference")
    catalog.addIndex(
        "organisational_unit_reference",
        "KeywordIndex",
    )
    transaction.commit()

    def reindex_relation_fields(obj):
        obj.reindexObject(
            idxs=["location_reference", "organisational_unit_reference"],
            update_metadata=True,
        )

    BatchProcess(
        "Reindex location and organisational_unit indexes",
        BatchProcess.collect_via_catalog(
            object_provides=(
                "kitconcept.intranet.behaviors.organisational_unit.IOrganisationalUnitBehavior",
                "kitconcept.intranet.behaviors.location.ILocationBehavior",
            )
        ),
        reindex_relation_fields,
    ).run()
