from plone import api
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
        user = api.user.get_current()
        if user is None:
            return
        brains = api.content.find(
            type="Person", username=user.getId(), unrestricted=True
        )
        if len(brains) != 1:
            return
        person = brains[0]

        # Add bq param, which is handled by solr
        boosts = []
        if person.organisational_unit_reference:
            boosts.append(
                f"organisational_unit_reference:({person.organisational_unit_reference})^10"
            )
        if person.location_reference:
            boosts.append(f"location_reference:({person.location_reference})^10")
        if boosts:
            query["bq"] = " ".join(boosts)


# To do:
# - test
# - also boost recent content
