from kitconcept.intranet.interfaces import IBrowserLayer
from kitconcept.intranet.utils.scripts import create_site
from kitconcept.intranet.utils.scripts import get_environmental_variables
from pathlib import Path

import os


SCRIPT_DIR = Path().cwd() / "scripts"


def main():
    """Create a site using the provided answers file and environmental variables."""
    app = globals()["app"]
    filename = os.getenv("ANSWERS", "default.json")
    answers_file = SCRIPT_DIR / filename
    env_vars = get_environmental_variables()
    create_site(app, env_vars, answers_file, IBrowserLayer)


if __name__ == "__main__":
    main()
