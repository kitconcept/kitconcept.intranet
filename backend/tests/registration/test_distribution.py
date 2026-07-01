import pytest


class TestDistribution:
    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal

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
    def test_plone_site_attributes(self, attr, expected):
        assert getattr(self.portal, attr) == expected

    @pytest.mark.parametrize(
        "package,expected",
        [
            ("kitconcept.intranet", True),
            ("collective.person", True),
            ("kitconcept.voltolighttheme", True),
            ("collective.contact_behaviors", True),
        ],
    )
    def test_dependencies_installed(self, installer, package, expected):
        assert installer.is_product_installed(package) is expected
