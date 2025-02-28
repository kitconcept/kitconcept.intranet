from kitconcept.intranet.upgrades import prepend_behavior
from kitconcept.intranet.upgrades import remove_behavior


def replace_theming_with_sitecustomization(setup_tool):
    remove_behavior("Plone Site", "kitconcept.theming")
    prepend_behavior("Plone Site", "kitconcept.sitecustomization")
