from copy import deepcopy
from kitconcept.intranet import _types as t
from kitconcept.intranet import logger
from plone import api

import json


KEY = "pas.plugins.authomatic.interfaces.IPasPluginsAuthomaticSettings.json_config"

TEMPLATES = {
    "authomatic-github": {
        "id": 1,
        "display": {
            "title": "Github",
            "cssclasses": {
                "button": "plone-btn plone-btn-default",
                "icon": "glypicon glyphicon-github",
            },
            "as_form": False,
        },
        "propertymap": {
            "email": "email",
            "link": "home_page",
            "location": "location",
            "name": "fullname",
            "avatar_url": "portrait",
            "username": "github_username",
        },
        "class_": "authomatic.providers.oauth2.GitHub",
        "consumer_key": "##consumer_key##",
        "consumer_secret": "##consumer_secret##",
        "scope": [""],
        "access_headers": {"User-Agent": "Plone (kitconcept.intranet)"},
    },
    "authomatic-google": {
        "id": 1,
        "display": {
            "title": "Google",
            "cssclasses": {
                "button": "plone-btn plone-btn-default",
                "icon": "glypicon glyphicon-google",
            },
            "as_form": False,
        },
        "propertymap": {
            "email": "email",
            "link": "home_page",
            "name": "fullname",
            "picture": "portrait",
        },
        "class_": "authomatic.providers.oauth2.Google",
        "consumer_key": "##consumer_key##",
        "consumer_secret": "##consumer_secret##",
        "scope": [""],
        "access_headers": {"User-Agent": "Plone (kitconcept.intranet)"},
    },
}


def _prepare_json_config(raw_answers: t.AnswersAuthomatic) -> dict:
    provider = raw_answers["provider"]
    template = TEMPLATES[provider]
    settings = deepcopy(template)
    prefix = f"{provider}-"
    answers = {
        key.replace(prefix, ""): value
        for key, value in raw_answers.items()
        if key.startswith(prefix)
    }
    for key, value in answers.items():
        if key in settings:
            settings[key] = value
    provider_id = provider.replace("authomatic-", "")
    return {provider_id: settings}


def setup_authomatic(raw_answers: t.AnswersAuthomatic):
    config = _prepare_json_config(raw_answers)
    data = json.dumps(config, indent=2)
    api.portal.set_registry_record(KEY, data)
    logger.info(f"Authentication: Set registry value on {KEY}")
