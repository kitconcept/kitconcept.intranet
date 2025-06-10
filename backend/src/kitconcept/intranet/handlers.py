from copy import deepcopy
from kitconcept.intranet import logger
from kitconcept.intranet.utils.authentication import setup_authentication
from plone import api
from plone.dexterity.schema import SCHEMA_CACHE
from plone.distribution.core import Distribution
from plone.distribution.utils.data import convert_data_uri_to_b64
from plone.exportimport.importers import get_importer
from Products.CMFPlone.Portal import PloneSite
from Products.CMFPlone.WorkflowTool import WorkflowTool

import transaction


def default_handler(
    distribution: Distribution, site: PloneSite, answers: dict
) -> PloneSite:
    """Default handler to create a new site."""
    # Process answers
    profiles = distribution.profiles
    setup_content = answers.get("setup_content", False)
    setup_tool = site["portal_setup"]
    for profile_id in profiles:
        setup_tool.runAllImportStepsFromProfile(f"profile-{profile_id}")

    # Add default content if needed
    if setup_content:
        # If there is no savepoint most tests fail with a PosKeyError
        transaction.savepoint(optimistic=True)
        contents = distribution.contents
        # First process any content profiles
        content_profiles = contents["profiles"]
        for profile_id in content_profiles:
            setup_tool.runAllImportStepsFromProfile(f"profile-{profile_id}")
        # Process content import from json
        content_json_path = contents["json"]
        if content_json_path:
            # Invalidate the schema cache to make sure we get up to date behaviors.
            # Normally this happens on commit, but we didn't commit yet.
            SCHEMA_CACHE.clear()
            importer = get_importer(site)
            importer.import_site(content_json_path)
            # Create a savepoint to ensure the import is atomic
            transaction.savepoint(optimistic=True)
            # Commit the transaction to finalize the import
            transaction.commit()
    return site


def pre_handler(answers: dict) -> dict:
    """Process answers."""
    return answers


def handler(distribution: Distribution, site: PloneSite, answers: dict) -> PloneSite:
    """Handler to create a new site."""
    default_profiles = distribution._profiles
    workflow = answers.get("workflow", "restricted")
    if workflow == "restricted":
        profiles = deepcopy(default_profiles)
        profiles["base"].append("kitconcept.intranet:restricted")
        distribution._profiles = profiles
    site = default_handler(distribution, site, answers)
    distribution._profiles = default_profiles
    return site


def post_handler(
    distribution: Distribution, site: PloneSite, answers: dict
) -> PloneSite:
    """Run after site creation."""
    name = distribution.name
    logger.info(f"{site.id}: Running {name} post_handler")
    # Update security
    wf_tool: WorkflowTool = api.portal.get_tool("portal_workflow")
    wf_tool.updateRoleMappings()
    raw_logo = answers.get("site_logo")
    if raw_logo:
        logo = convert_data_uri_to_b64(raw_logo)
        logger.info(f"{site.id}: Set logo")
        api.portal.set_registry_record("plone.site_logo", logo)
    # This should be fixed on plone.distribution
    site.title = answers.get("title", site.title)
    site.description = answers.get("description", site.description)
    # Configure authentication
    auth_answers = answers.get("authentication")
    if auth_answers:
        logger.info(f"{site.id}: Processing authentication options")
        setup_authentication(auth_answers)
    return site
