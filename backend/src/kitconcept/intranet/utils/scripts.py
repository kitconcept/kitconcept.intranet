from kitconcept.core.utils import scripts
from kitconcept.intranet.interfaces import IBrowserLayer
from pathlib import Path
from Products.CMFPlone.Portal import PloneSite
from typing import Any
from zope.interface.interface import InterfaceClass


__all__ = [
    "create_site",
]


OPTIONS: tuple[tuple[str, str, Any], ...] = (
    ("site_id", "SITE_ID", None),
    ("title", "SITE_TITLE", None),
    ("description", "SITE_DESCRIPTION", None),
    ("available_languages", "SITE_AVAILABLE_LANGUAGES", scripts.as_list),
    ("default_language", "SITE_DEFAULT_LANGUAGE", None),
    ("portal_timezone", "SITE_PORTAL_TIMEZONE", None),
    ("setup_solr", "SITE_SETUP_SOLR", scripts.as_bool),
    ("setup_content", "SITE_SETUP_CONTENT", scripts.as_bool),
    ("demo_content", "SITE_DEMO_CONTENT", scripts.as_bool),
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
    ("authentication.oidc-scope", "SITE_AUTHENTICATION_OIDC-SCOPE", scripts.as_list),
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
        scripts.as_list,
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
        scripts.as_list,
    ),
)


def create_site(
    app,
    env_vars: dict[str, Any],
    answers_file: Path,
    browser_layer: type[InterfaceClass] | None = None,
    additional_profiles: tuple[str, ...] = (),
) -> PloneSite:
    """Create a site using the provided answers file and environmental variables."""
    # We hardcode the distribution name here as this script
    # should not be used for other distributions.

    distribution = "kitconcept-intranet"
    package_iface: list[type[InterfaceClass]] = [IBrowserLayer]

    if browser_layer is not None:
        # Add the provided browser layer to the package interface list,
        # ensuring it is the first.
        package_iface.insert(0, browser_layer)

    return scripts.create_site(
        app=app,
        answers_file=answers_file,
        env_answers=env_vars,
        package_iface=package_iface,
        env_options=OPTIONS,
        additional_profiles=additional_profiles,
        distribution=distribution,
    )
