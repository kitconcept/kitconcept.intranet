from plone.app.querystring.querybuilder import QueryBuilder as BaseQueryBuilder


class QueryBuilder(BaseQueryBuilder):

    def __call__(self, query, **kw):
        # keep track of whether a userRelevance sort was requested
        # before the normal code removes it
        self.user_relevance = kw.get("sort_on") == "userRelevance"
        return super().__call__(query, **kw)

    def filter_query(self, query):
        query = super().filter_query(query)
        if self.user_relevance:
            # to do: get the boost values from the current user
            query["bq"] = (
                "location_reference:(97e82b07b5444728b1517de15c79fefb^10) organisational_unit_reference:(1a22eddf0e7941a0962cbfaa785e4b4d^10)"
            )
        return query


# Patch plone.app.querystring to return userRelevance as a sortable index,
# even though it's not a real index.
from plone.app.querystring.registryreader import QuerystringRegistryReader

old_mapSortableIndexes = QuerystringRegistryReader.mapSortableIndexes


def mapSortableIndexes(self, values):
    result = old_mapSortableIndexes(self, values)
    result["sortable"]["userRelevance"] = values.get(
        "plone.app.querystring.field.userRelevance"
    )
    return result


QuerystringRegistryReader.mapSortableIndexes = mapSortableIndexes


# Patch collective.solr to retain bq param
from collective.solr import search

old_subtractQueryParameters = search.subtractQueryParameters


def subtractQueryParameters(args, request_keywords=None):
    params = old_subtractQueryParameters(args, request_keywords)
    if "bq" in args:
        params["bq"] = args.pop("bq")
    return params


search.subtractQueryParameters = subtractQueryParameters

# To do:
# - Actually get the boost values from the current user
# - Make it possible for an IQueryModifier to modify the sort
# - Make plone.app.querystring's filtering of sort_on less aggressive
# - Make collective.solr retain bq without needing a patch
