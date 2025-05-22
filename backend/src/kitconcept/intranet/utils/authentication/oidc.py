from kitconcept.intranet import _types as t
from kitconcept.intranet import logger
from plone import api


ANSWER_PREFIX = "oidc-"


def _prepare_answers(raw_answers: t.AnswersOIDC) -> dict:
    answers = {
        "create_restapi_ticket": True,
    }
    answers.update({
        key.replace(ANSWER_PREFIX, ""): value
        for key, value in raw_answers.items()
        if key.startswith(ANSWER_PREFIX)
    })
    # Set the correct redirect_urls
    site_url = answers.pop("site-url")
    answers["redirect_uris"] = (f"{site_url}/login-oidc/oidc",)
    return answers


def _setup_oidc(raw_answers: t.AnswersOIDC):
    answers = _prepare_answers(raw_answers)
    portal = api.portal.get()
    plugin = portal.acl_users.oidc
    for key, value in answers.items():
        logger.info(f"Authentication: Set attribute {key} on {plugin}")
        setattr(plugin, key, value)


def setup_oidc_auth(raw_answers: t.AnswersOIDC):
    _setup_oidc(raw_answers)
    logger.info("Authentication: OIDC authentication setup")
