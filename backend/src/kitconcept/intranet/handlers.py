from kitconcept.intranet import logger
from plone import api
from plone.distribution.core import Distribution
from plone.distribution.utils.data import convert_data_uri_to_b64
from Products.CMFPlone.Portal import PloneSite
from Products.CMFPlone.WorkflowTool import WorkflowTool


def pre_handler(answers: dict) -> dict:
    """Process answers."""
    return answers


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
    return site
