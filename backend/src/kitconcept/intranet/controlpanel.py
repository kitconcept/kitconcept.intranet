from plone.app.registry.browser.controlpanel import ControlPanelFormWrapper
from plone.app.registry.browser.controlpanel import RegistryEditForm
from plone.restapi.controlpanels import RegistryConfigletPanel
from zope import schema
from zope.component import adapter
from zope.interface import Interface


class IIntranetSettings(Interface):
    """Intranet project settings stored in the backend"""

    external_search_url = schema.URI(
        title="External Search URL",
        description="Used in the intranet header seach bar.",
        required=False,
    )

    search_field_placeholder = schema.TextLine(
        title="Search Field Placeholder",
        description="Placeholder text for the search field.",
        required=False,
    )


class IntranetSettingsEditForm(RegistryEditForm):
    schema = IIntranetSettings
    label = "Volto Settings"
    schema_prefix = "volto"

    def updateFields(self):
        super().updateFields()

    def updateWidgets(self):
        super().updateWidgets()


class IntranetSettingsControlPanel(ControlPanelFormWrapper):
    form = IntranetSettingsEditForm


@adapter(Interface, Interface)
class IntranetControlpanel(RegistryConfigletPanel):
    schema = IIntranetSettings
    configlet_id = "IntranetSettings"
    configlet_category_id = "plone-general"
    schema_prefix = "intranet"
