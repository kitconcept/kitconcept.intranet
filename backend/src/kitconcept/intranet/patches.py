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
