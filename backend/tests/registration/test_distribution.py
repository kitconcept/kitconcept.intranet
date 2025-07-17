# from plone import api
# from plone.app.testing.interfaces import SITE_OWNER_NAME
# from Products.CMFCore.WorkflowCore import WorkflowException

import pytest


class TestDistribution:
    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Intranet"),
            (
                "description",
                "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
            ),
        ],
    )
    def test_plone_site_attributes(self, portal, attr, expected):
        assert getattr(portal, attr) == expected

    @pytest.mark.parametrize(
        "package,expected",
        [],
    )
    def test_dependencies_installed(self, installer, package, expected):
        assert installer.is_product_installed(package) is expected

    # @ericof I don't understand the reason behind this test or what tries to accomplish
    # since it's contradictory to the tests in creation/test_creation_public.py and
    # creation/test_creation_restricted.py
    # @pytest.mark.parametrize(
    #     "path,title,portal_type,review_state",
    #     [
    #         ("/", "Intranet", "Plone Site", "private"),
    #     ],
    # )
    # def test_content_created(self, portal, path, title, portal_type, review_state):
    #     with api.env.adopt_user(SITE_OWNER_NAME):
    #         content = api.content.get(path=path)
    #     assert content.title == title
    #     assert content.portal_type == portal_type
    #     if review_state:
    #         assert api.content.get_state(content) == review_state
    #     else:
    #         with pytest.raises(WorkflowException) as exc:
    #             api.content.get_state(content)
    #         assert "No workflow provides" in str(exc)
