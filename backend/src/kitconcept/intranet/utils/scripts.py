from kitconcept.core.utils.scripts import create_site
from typing import Any

import os


__all__ = ["create_site", "get_environmental_variables"]

marker = object()  # Unique marker object to indicate no value


truthy = frozenset(("t", "true", "y", "yes", "on", "1"))


def as_bool(value: str) -> bool:
    """Coerce a string into a boolean.

    :param value: Value to be evaluated. A case-insensitive match against the
        :data:`truthy` set yields ``True``; anything else yields ``False``.
        ``None`` returns ``False`` and an existing :class:`bool` is returned
        unchanged.
    :returns: The boolean interpretation of ``value``.
    """
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    value = str(value).strip()
    return value.lower() in truthy


def as_list(value: str) -> list[str]:
    """Split a comma-separated string into a list of trimmed values.

    :param value: Comma-separated string, e.g. ``"en, de, fr"``. An empty or
        falsy value yields an empty list.
    :returns: List of whitespace-stripped items.
    """
    if not value:
        return []
    items = value.split(",")
    return [item.strip() for item in items]


OPTIONS: tuple[tuple[str, str, Any], ...] = (
    ("site_id", "SITE_ID", None),
    ("title", "SITE_TITLE", None),
    ("description", "SITE_DESCRIPTION", None),
    ("available_languages", "SITE_AVAILABLE_LANGUAGES", as_list),
    ("default_language", "SITE_DEFAULT_LANGUAGE", None),
    ("portal_timezone", "SITE_PORTAL_TIMEZONE", None),
    ("setup_solr", "SITE_SETUP_SOLR", as_bool),
    ("setup_content", "SITE_SETUP_CONTENT", as_bool),
    ("demo_content", "SITE_DEMO_CONTENT", as_bool),
    ("workflow", "SITE_WORKFLOW", None),
    ("authentication.provider", "SITE_AUTHENTICATION_PROVIDER", None),
    ("authentication.oidc-server_url", "SITE_AUTHENTICATION_OIDC-SERVER_URL", None),
    ("authentication.oidc-realm_name", "SITE_AUTHENTICATION_OIDC-REALM_NAME", None),
    ("authentication.oidc-client_id", "SITE_AUTHENTICATION_OIDC-CLIENT_ID", None),
    (
        "authentication.oidc-client_secret",
        "SITE_AUTHENTICATION_OIDC-CLIENT_SECRET",
        None,
    ),
    ("authentication.oidc-site-url", "SITE_AUTHENTICATION_OIDC-SITE-URL", None),
    ("authentication.oidc-scope", "SITE_AUTHENTICATION_OIDC-SCOPE", as_list),
    ("authentication.oidc-issuer", "SITE_AUTHENTICATION_OIDC-ISSUER", None),
    (
        "authentication.authomatic-github-consumer_key",
        "SITE_AUTHENTICATION_AUTHOMATIC-GITHUB-CONSUMER_KEY",
        None,
    ),
    (
        "authentication.authomatic-github-consumer_secret",
        "SITE_AUTHENTICATION_AUTHOMATIC-GITHUB-CONSUMER_SECRET",
        None,
    ),
    (
        "authentication.authomatic-github-scope",
        "SITE_AUTHENTICATION_AUTHOMATIC-GITHUB-SCOPE",
        as_list,
    ),
    (
        "authentication.authomatic-google-consumer_key",
        "SITE_AUTHENTICATION_AUTHOMATIC-GOOGLE-CONSUMER_KEY",
        None,
    ),
    (
        "authentication.authomatic-google-consumer_secret",
        "SITE_AUTHENTICATION_AUTHOMATIC-GOOGLE-CONSUMER_SECRET",
        None,
    ),
    (
        "authentication.authomatic-google-scope",
        "SITE_AUTHENTICATION_AUTHOMATIC-GOOGLE-SCOPE",
        as_list,
    ),
)


def get_environmental_variables() -> dict[str, Any]:
    """Collect site-creation answers from environment variables.

    Each entry in :data:`OPTIONS` maps an answer key to an environment variable
    name and an optional transform callable (e.g. :func:`as_bool`,
    :func:`as_list`). Variables that are not set are skipped, so the resulting
    mapping only contains keys explicitly provided via the environment. Keys
    containing a ``.`` (e.g. ``authentication.provider``) are expanded into a
    nested dictionary.

    :returns: Mapping of answer keys to their (optionally transformed) values,
        ready to be merged into the site-creation answers.
    """
    env_vars: dict[str, Any] = {}
    for key, env_var, transform in OPTIONS:
        value = os.getenv(env_var, marker)
        if value is marker:
            continue
        elif transform:
            value = transform(value)
        if "." in key:
            # Handle nested keys for authentication settings
            main_key, sub_key = key.split(".", 1)
            if main_key not in env_vars:
                env_vars[main_key] = {}
            env_vars[main_key][sub_key] = value
        else:
            env_vars[key] = value
    return env_vars
