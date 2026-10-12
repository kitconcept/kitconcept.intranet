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

    ITypeSettings._InterfaceClass__attrs["restrict_to_path"] = schema.TextLine(
        __name__="restrict_to_path",
        title=_("label_restrict_to_path", default="Restrict to path"),
        description=_(
            "help_restrict_to_path",
            default="If specified, this content type can only be added in this path.",
        ),
        required=False,
    )

    from z3c.form import field
    from zope.dottedname.resolve import resolve as resolveDottedName
    from plone.app.dexterity.browser.overview import TypeOverviewForm
    from Products.CMFCore.interfaces import IFolderish

    @property
    def patched_fields(self):
        klass = resolveDottedName(self.context.fti.klass)
        fields = field.Fields(ITypeSettings)
        filtered = fields.select(
            "title",
            "description",
            "global_allow",
            "restrict_to_path",
            "filter_content_types",
            "allowed_content_types",
        )
        if not IFolderish.implementedBy(klass):
            del filtered["filter_content_types"]
            del filtered["allowed_content_types"]
        return filtered

    TypeOverviewForm.fields = patched_fields


def apply_patches():
    apply_type_settings_patch()
