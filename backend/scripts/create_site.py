from AccessControl.SecurityManagement import newSecurityManager
from kitconcept.intranet.utils.scripts import asbool
from kitconcept.intranet.utils.scripts import parse_answers
from pathlib import Path
from plone.distribution.api import site as site_api
from Testing.makerequest import makerequest

import logging
import os
import transaction


logging.basicConfig(format="%(message)s")

# Silence some loggers
for logger_name in [
    "GenericSetup.componentregistry",
    "Products.MimetypesRegistry.MimeTypesRegistry",
]:
    logging.getLogger(logger_name).setLevel(logging.ERROR)

logger = logging.getLogger("Plone Site Creation")
logger.setLevel(logging.DEBUG)

SCRIPT_DIR = Path().cwd() / "scripts"

app = makerequest(globals()["app"])

request = app.REQUEST

admin = app.acl_users.getUserById("admin")
admin = admin.__of__(app.acl_users)
newSecurityManager(None, admin)


def get_answers_file(filename: str) -> Path:
    return SCRIPT_DIR / filename


# VARS
DISTRIBUTION = os.getenv("DISTRIBUTION", "kitconcept-intranet")
ANSWERS_FILE = os.getenv("ANSWERS", "default.json")
DELETE_EXISTING = asbool(os.getenv("DELETE_EXISTING"))
# ANSWERS OVERRIDE
ANSWERS = {
    "site_id": os.getenv("SITE_ID"),
    "title": os.getenv("SITE_TITLE"),
    "description": os.getenv("SITE_DESCRIPTION"),
    "default_language": os.getenv("SITE_DEFAULT_LANGUAGE"),
    "portal_timezone": os.getenv("SITE_PORTAL_TIMEZONE"),
    "workflow": os.getenv("SITE_WORKFLOW"),
    "setup_content": os.getenv("SITE_SETUP_CONTENT", "true"),
}


def main():
    # Load site creation parameters
    answers_file = get_answers_file(ANSWERS_FILE)
    answers = parse_answers(answers_file, ANSWERS)
    if "distribution" not in answers:
        answers["distribution"] = DISTRIBUTION
    site_id = answers["site_id"]

    logger.info(f"Creating a new Plone site  @ {site_id}")
    logger.info(
        f" - Using the {DISTRIBUTION} distribution and answers from {answers_file}"
    )

    if site_id in app.objectIds():
        if DELETE_EXISTING:
            app.manage_delObjects([site_id])
            transaction.commit()
            app._p_jar.sync()
            logger.info(f" - Deleted existing site with id {site_id}")
        else:
            logger.info(
                " - Stopping site creation, as there is already a site with id "
                f"{site_id} at the instance. Set DELETE_EXISTING=1 to delete "
                "the existing site before creating a new one."
            )

    if site_id not in app.objectIds():
        site_api._create_site(
            context=app, distribution_name=DISTRIBUTION, answers=answers
        )
        transaction.commit()
        app._p_jar.sync()
        logger.info(" - Site created!")


if __name__ == "__main__":
    main()
