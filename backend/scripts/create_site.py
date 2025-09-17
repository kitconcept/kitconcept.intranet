from kitconcept.core.utils.scripts import create_site
from kitconcept.intranet.interfaces import IBrowserLayer
from pathlib import Path

import os


SCRIPT_DIR = Path().cwd() / "scripts"


def _string_as_list(value: str) -> list[str]:
    items = value.split(",")
    return [item.strip() for item in items]


# ANSWERS OVERRIDE
ANSWERS = {
    "site_id": os.getenv("SITE_ID"),
    "title": os.getenv("SITE_TITLE"),
    "description": os.getenv("SITE_DESCRIPTION"),
    "available_languages": _string_as_list(
        os.getenv("SITE_AVAILABLE_LANGUAGES", os.getenv("SITE_DEFAULT_LANGUAGE", "de"))
    ),
    "portal_timezone": os.getenv("SITE_PORTAL_TIMEZONE"),
    "setup_content": os.getenv("SITE_SETUP_CONTENT", "true"),
    "demo_content": os.getenv("SITE_DEMO_CONTENT", "true"),
    "workflow": os.getenv("SITE_WORFLOW", "public"),
    "setup_solr": os.getenv("SITE_SETUP_SOLR", "false"),
    "authentication": {
        "provider": os.getenv("SITE_AUTHENTICATION_PROVIDER", "internal"),
        "oidc-server_url": os.getenv("SITE_AUTHENTICATION_OIDC-SERVER_URL"),
        "oidc-realm_name": os.getenv("SITE_AUTHENTICATION_OIDC-REALM_NAME"),
        "oidc-client_id": os.getenv("SITE_AUTHENTICATION_OIDC-CLIENT_ID"),
        "oidc-client_secret": os.getenv("SITE_AUTHENTICATION_OIDC-CLIENT_SECRET"),
        "oidc-site-url": os.getenv("SITE_AUTHENTICATION_OIDC-SITE-URL"),
        "oidc-scope": _string_as_list(
            os.getenv("SITE_AUTHENTICATION_OIDC-SCOPE", "profile,email")
        ),
        "oidc-issuer": os.getenv("SITE_AUTHENTICATION_OIDC-ISSUER"),
        "authomatic-github-consumer_key": os.getenv(
            "SITE_AUTHENTICATION_AUTHOMATIC-GITHUB-CONSUMER_KEY"
        ),
        "authomatic-github-consumer_secret": os.getenv(
            "SITE_AUTHENTICATION_AUTHOMATIC-GITHUB-CONSUMER_SECRET"
        ),
        "authomatic-github-scope": _string_as_list(
            os.getenv(
                "SITE_AUTHENTICATION_AUTHOMATIC-GITHUB-SCOPE", "read:user,user:email"
            )
        ),
        "authomatic-google-consumer_key": os.getenv(
            "SITE_AUTHENTICATION_AUTHOMATIC-GOOGLE-CONSUMER_KEY"
        ),
        "authomatic-google-consumer_secret": os.getenv(
            "SITE_AUTHENTICATION_AUTHOMATIC-GOOGLE-CONSUMER_SECRET"
        ),
        "authomatic-google-scope": _string_as_list(
            os.getenv("SITE_AUTHENTICATION_AUTHOMATIC-GOOGLE-SCOPE", "profile,email")
        ),
    },
}


def main():
    app = globals()["app"]
    filename = os.getenv("ANSWERS", "default.json")
    answers_file = SCRIPT_DIR / filename
    create_site(app, ANSWERS, answers_file, IBrowserLayer)


if __name__ == "__main__":
    main()
