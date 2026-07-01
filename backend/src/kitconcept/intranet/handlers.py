from copy import deepcopy
from kitconcept.core.utils import creation as utils
from kitconcept.core.utils.distributions import handler as _handler
from kitconcept.core.utils.distributions import post_handler as _post_handler
from plone import api
from plone.distribution.core import Distribution
from Products.CMFPlone.Portal import PloneSite

import os


def handler(distribution: Distribution, site: PloneSite, answers: dict) -> PloneSite:
    """Handler to create a new site."""
    default_profiles = distribution._profiles
    profiles = deepcopy(default_profiles)
    workflow = answers.get("workflow", "public")
    if workflow == "restricted":
        profiles["base"].append("kitconcept.intranet:restricted")
    if answers.get("setup_solr", False):
        # Explicitly add Solr profiles
        profiles["base"].append("kitconcept.solr:default")
        profiles["base"].append("kitconcept.intranet:solr")
    distribution._profiles = profiles
    site = _handler(distribution, site, answers)
    # Handle Plone site workflow state
    if workflow == "public" and api.content.get_state(site) == "private":
        api.content.transition(site, "publish")
    distribution._profiles = default_profiles
    return site


def post_handler(
    distribution: Distribution, site: PloneSite, answers: dict
) -> PloneSite:
    """Run after site creation."""
    _post_handler(distribution, site, answers)
    if os.environ.get("SOLR_ACTIVATE"):
        registry_data = {"collective.solr.active": True}
        utils.update_registry(registry_data)

    # Make sure intranet header is used even if we didn't import content
    site.has_intranet_header = True
    return site
