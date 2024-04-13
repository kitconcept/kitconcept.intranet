from pathlib import Path
from plone import api
from Products.CMFCore.indexing import processQueue
from Products.CMFPlone.interfaces import INonInstallable
from zope.interface import implementer

import logging


logger = logging.getLogger("kitconcept.intranet.setuphandlers")


@implementer(INonInstallable)
class HiddenProfiles:
    def getNonInstallableProfiles(self):
        """Hide uninstall profile from site-creation and quickinstaller"""
        return ["kitconcept.intranet:uninstall"]


def uninstall(context):
    """Uninstall script"""
    # Do something at the end of the uninstallation of this package.


def package_root_folder() -> Path:
    """Get the kitconcept.intranet fs path."""
    current_folder = Path(__file__).parent.resolve()
    return current_folder.parent


def post_install(context):
    """Post install script"""
    # portal = api.portal.get()

    # make sure indexing queue is processed while component site is still active
    processQueue()


def initial_setup(context):
    """Creates setup for dlr"""
    post_install(context)


def print_error(error_string):  # RED
    print(f"\033[31mERROR: {error_string}\033[0m")  # noqa
    logger.error(f"{error_string}")


def print_info(info_string):  # GREEN
    print(f"\033[33m{info_string}\033[0m")  # noqa
    logger.info(f"{info_string}")


def create_object(path, is_folder=False):
    """Recursively create object and folder structure if necessary"""
    obj = api.content.get(path=path)
    if obj is not None:
        return obj

    path_parent, obj_id = path.rsplit("/", 1)
    if path_parent == "":
        parent = api.portal.get()
    else:
        parent = create_object(path_parent, is_folder=True)

    print_info(f'Creating "{path}"')

    obj = api.content.create(
        container=parent, type="Folder" if is_folder else "Document", id=obj_id
    )
    api.content.transition(obj=obj, transition="publish")
    return obj
