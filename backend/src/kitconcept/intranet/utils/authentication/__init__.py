from kitconcept.intranet import _types as t
from kitconcept.intranet import logger
from plone import api
from Products.GenericSetup.tool import SetupTool


__all__ = ["setup_authentication"]


def _install_profiles(profiles: tuple[str]):
    setup_tool: SetupTool = api.portal.get_tool("portal_setup")
    for profile in profiles:
        setup_tool.runAllImportStepsFromProfile(f"profile-{profile}")
        logger.info(f"Authentication: Installed profile {profile}")


def _setup_plone_auth(answers: t.AuthAnswers):
    logger.info("Authentication: Plone authentication setup")


def get_authentication_provider(provider: str) -> t.AuthenticationProvider:
    from .authomatic import setup_authomatic
    from .keycloak import setup_keycloak_auth
    from .oidc import setup_oidc_auth

    providers = {
        "plone": t.AuthenticationProvider(_setup_plone_auth, ()),
        "keycloak": t.AuthenticationProvider(
            setup_keycloak_auth,
            (
                "pas.plugins.oidc:default",
                "pas.plugins.keycloakgroups:default",
            ),
        ),
        "oidc": t.AuthenticationProvider(
            setup_oidc_auth, ("pas.plugins.oidc:default",)
        ),
        "authomatic-github": t.AuthenticationProvider(
            setup_authomatic, ("pas.plugins.authomatic:default",)
        ),
        "authomatic-google": t.AuthenticationProvider(
            setup_authomatic, ("pas.plugins.authomatic:default",)
        ),
    }
    return providers.get(provider, providers["plone"])


def setup_authentication(answers: t.AuthAnswers):
    """Setup authentication based on answers provided by the user."""
    provider = answers.get("provider", "plone")
    auth_provider = get_authentication_provider(provider)
    # First install dependencies
    _install_profiles(auth_provider.profiles)
    # Delegate to the correct handler
    auth_provider.handler(answers)
