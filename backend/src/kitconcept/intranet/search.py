from plone.app.querystring.querybuilder import QueryBuilder as BaseQueryBuilder


class QueryBuilder(BaseQueryBuilder):

    def filter_query(self, query):
        query = super().filter_query(query)
        if query.get("sort_on") == "userRelevance":
            query.pop("sort_on")
            # to do: get the boost values from the current user
            query["bq"] = (
                "location_reference:(97e82b07b5444728b1517de15c79fefb^10) organisational_unit_reference:(1a22eddf0e7941a0962cbfaa785e4b4d^10)"
            )
        return query
