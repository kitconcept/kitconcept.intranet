from kitconcept.intranet.interfaces import IBrowserLayer
from kitconcept.intranet.utils.scripts import create_site
from pathlib import Path

import os


SCRIPT_DIR = Path().cwd() / "scripts"
ADDITIONAL_PROFILES: tuple[str, ...] = ()


def main():
    """Create a site using the provided answers file and environmental variables."""
    app = globals()["app"]
    filename = os.getenv("ANSWERS", "default.json")
    answers_file = SCRIPT_DIR / filename
    create_site(
        app=app,
        env_vars={},
        answers_file=answers_file,
        browser_layer=IBrowserLayer,
        additional_profiles=ADDITIONAL_PROFILES,
    )


if __name__ == "__main__":
    main()
