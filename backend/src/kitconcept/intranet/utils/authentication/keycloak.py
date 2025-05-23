from copy import deepcopy
from kitconcept.intranet import _types as t
from kitconcept.intranet import logger
from plone import api


ANSWER_PREFIX = "oidc-"


def _answers_to_keycloak_groups(raw_answers: t.AnswersKeycloak) -> dict:
    keycloak_groups = {"enabled": True}
    answers = {
        key.replace(ANSWER_PREFIX, ""): value
        for key, value in raw_answers.items()
        if key.startswith(ANSWER_PREFIX)
    }
    # Remove site-url, scope
    for key in ("site-url", "scope"):
        answers.pop(key, None)
    keycloak_groups.update(deepcopy(answers))
    return keycloak_groups


def _answers_to_oidc(raw_answers: t.AnswersKeycloak) -> t.AnswersOIDC:
    answers = deepcopy(raw_answers)
    server_url = answers.pop(f"{ANSWER_PREFIX}server_url")
    realm = answers.pop(f"{ANSWER_PREFIX}realm_name")
    answers[f"{ANSWER_PREFIX}issuer"] = f"{server_url}/realms/{realm}"
    return answers


def _setup_keycloak_groups(payload_groups: dict):
    for key, value in payload_groups.items():
        name = f"keycloak_groups.{key}"
        logger.info(f"Authentication: Set registry {name}")
        api.portal.set_registry_record(name, value)


def setup_keycloak_auth(raw_answers: t.AnswersKeycloak):
    from kitconcept.intranet.utils.authentication.oidc import _setup_oidc

    # Setup keycloak_groups
    payload_groups = _answers_to_keycloak_groups(raw_answers)
    _setup_keycloak_groups(payload_groups)
    # Setup oidc
    payload_oidc = _answers_to_oidc(raw_answers)
    _setup_oidc(payload_oidc)
    logger.info("Authentication: Keycloak authentication setup")
