from kitconcept.intranet.utils.get_person import get_current_user_person
from plone.app.querystring.querybuilder import QueryBuilder as BaseQueryBuilder


class QueryBuilder(BaseQueryBuilder):
    """Custom QueryBuilder to add user-specific boosting when sort_on=userRelevance"""

    def filter_query(self, query):
        # We do this in filter_query instead of with an IQueryModifier adapter
        # because an IQueryModifier would not have access to the sort_on param
        query = super().filter_query(query)
        self.make_user_relevance_query(query)
        return query

    def make_user_relevance_query(self, query):
        """If sort_on=userRelevance, add boosts based on the current user"""
        # Remove fake userRelevance sort_on
        sort_on = query.get("sort_on")
        if sort_on != "userRelevance":
            return
        query.pop("sort_on")

        # Find Person object for the current user
        person = get_current_user_person()
        if person is None:
            return

        # Add bq param, which is handled by solr
        boosts = []
        if person.organisational_unit_reference:
            for value in person.organisational_unit_reference:
                boosts.append(f"organisational_unit_reference:({value})^10")
        if person.location_reference:
            for value in person.location_reference:
                boosts.append(f"location_reference:({value})^8")
        if boosts:
            # Specify OR operator, since AND is default
            query["bq"] = " OR " + " OR ".join(boosts)


# At the moment collective.solr discards the bq param,
# so we need to patch it back in here.
from collective.solr.search import Search


orig_buildQueryAndParameters = Search.buildQueryAndParameters


def buildQueryAndParameters(self, default=None, **args):
    bq = args.pop("bq", None)
    query, params = orig_buildQueryAndParameters(self, default=default, **args)
    if bq:
        query["bq"] = bq
    return query, params


Search.buildQueryAndParameters = buildQueryAndParameters


# To do:
# - also boost recent content
