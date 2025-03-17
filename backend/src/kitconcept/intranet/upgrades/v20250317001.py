from kitconcept.intranet.upgrades import prepend_behavior
from kitconcept.intranet.upgrades import remove_behavior


def replace_sitecustomization_with_splitted_behaviors(setup_tool):
    remove_behavior("Plone Site", "kitconcept.sitecustomization")
    prepend_behavior("Plone Site", "kitconcept.sitecustomization.footer")
    prepend_behavior("Plone Site", "kitconcept.sitecustomization.theme")
    prepend_behavior("Plone Site", "kitconcept.sitecustomization.header")
