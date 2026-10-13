from kitconcept.intranet import _
from zope import schema


def apply_type_settings_patch():
    # Add the global_allow field to the TypeOverviewForm.
    # (We should change this upstream.)

    from plone.app.dexterity.interfaces import ITypeSettings

    ITypeSettings._InterfaceClass__attrs["global_allow"] = schema.Bool(
        __name__="global_allow",
        title=_("label_global_allow", default="Implicitly addable"),
        description=_(
            "help_global_allow",
            default="If checked, this type can be added to any container.",
        ),
    )

    ITypeSettings._InterfaceClass__attrs["restrict_to_paths"] = schema.Text(
        __name__="restrict_to_paths",
        title=_("label_restrict_to_paths", default="Restrict to paths"),
        description=_(
            "help_restrict_to_paths",
            default=(
                "If specified, this content type can only be added in these paths "
                "and their descendants. Enter one site-relative path per line "
                "(for example /news)."
            ),
        ),
        required=False,
    )

    from plone.app.dexterity.browser.overview import TypeOverviewForm
    from Products.CMFCore.interfaces import IFolderish
    from z3c.form import field
    from zope.dottedname.resolve import resolve as resolveDottedName

    @property
    def patched_fields(self):
        klass = resolveDottedName(self.context.fti.klass)
        fields = field.Fields(ITypeSettings)
        filtered = fields.select(
            "title",
            "description",
            "global_allow",
            "restrict_to_paths",
            "filter_content_types",
            "allowed_content_types",
        )
        if not IFolderish.implementedBy(klass):
            del filtered["filter_content_types"]
            del filtered["allowed_content_types"]
        return filtered

    TypeOverviewForm.fields = patched_fields


def apply_types_info_patch():
    from plone import api
    from plone.restapi.services.types.get import TypesInfo

    if getattr(TypesInfo.__call__, "_intranet_path_restrictions", False):
        return

    original_call = TypesInfo.__call__

    def restricted_types_info(self, expand=False):
        response = original_call(self, expand=expand)
        if not expand:
            return response

        portal_types = api.portal.get_tool("portal_types")
        portal_path = "/".join(api.portal.get().getPhysicalPath())
        current_path = "/".join(self.context.getPhysicalPath())
        for info in response["types"]:
            fti = portal_types[info["id"]]
            value = getattr(fti, "restrict_to_paths", None) or ""
            paths = [
                portal_path + "/" + line.strip().strip("/")
                for line in value.splitlines()
                if line.strip()
            ]
            if paths and not any(
                current_path == path.rstrip("/")
                or current_path.startswith(path.rstrip("/") + "/")
                for path in paths
            ):
                info["addable"] = False
                info["immediately_addable"] = False
        return response

    restricted_types_info._intranet_path_restrictions = True
    TypesInfo.__call__ = restricted_types_info


def apply_patches():
    apply_type_settings_patch()
    apply_types_info_patch()
