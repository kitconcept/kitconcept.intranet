from kitconcept.intranet.upgrades import prepend_behavior
from kitconcept.intranet.upgrades import remove_behavior


def replace_sitecustomization_with_split_behaviors(setup_tool):
    remove_behavior("Plone Site", "kitconcept.sitecustomization")
    prepend_behavior("Plone Site", "voltolighttheme.footer")
    prepend_behavior("Plone Site", "voltolighttheme.theme")
    prepend_behavior("Plone Site", "voltolighttheme.header")
