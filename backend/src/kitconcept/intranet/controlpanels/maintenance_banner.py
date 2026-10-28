from kitconcept.intranet import _
from plone.app.textfield import RichText
from plone.registry.field import PersistentField
from plone.restapi.controlpanels import RegistryConfigletPanel
from zope import schema
from zope.component import adapter
from zope.interface import Interface

import plone.registry.field


class PersistentRichText(PersistentField, RichText):
    pass


plone.registry.field.RichText = PersistentRichText


class IMaintenanceBanner(Interface):
    show_banner = schema.Bool(
        title=_("label_show_banner", default="Activate maintenance banner"),
        default=False,
    )

    banner_title = schema.TextLine(
        title=_("label_title", default="Title"),
        default="Warning",
        required=True,
    )

    banner_text = RichText(
        title=_("label_description", default="Description"),
        required=True,
    )

    date = schema.Date(
        title=_("label_date", default="Date"),
        required=False,
    )


@adapter(Interface, Interface)
class MaintenanceBannerControlpanel(RegistryConfigletPanel):
    schema = IMaintenanceBanner
    schema_prefix = "maintenance_banner"
    configlet_id = "maintenance-banner"
    configlet_category_id = "plone-general"

    group = _("General")
    title = _("Maintenance Banner")
