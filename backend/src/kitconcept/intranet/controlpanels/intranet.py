from kitconcept.intranet import _
from kitconcept.intranet.interfaces import IBrowserLayer
from plone.app.registry.browser.controlpanel import ControlPanelFormWrapper
from plone.app.registry.browser.controlpanel import RegistryEditForm
from plone.registry.interfaces import IRegistry
from plone.restapi.controlpanels import RegistryConfigletPanel
from plone.restapi.interfaces import ISiteEndpointExpander
from zope import schema
from zope.component import adapter
from zope.component import getUtility
from zope.interface import Interface
from zope.interface import implementer


class IIntranetSettings(Interface):
    """Intranet project settings stored in the backend"""

    external_search_url = schema.URI(
        title=_("External Search URL"),
        description=_("Used in the intranet header seach bar."),
        required=False,
    )

    search_field_placeholder = schema.TextLine(
        title=_("Search Field Placeholder"),
        description=_("Placeholder text for the search field."),
        required=False,
    )

    custom_css = schema.Text(
        title=_("Custom CSS"),
        description=_("Custom CSS for the intranet."),
        required=False,
    )


class IntranetSettingsEditForm(RegistryEditForm):
    schema = IIntranetSettings
    label = _("Intranet Settings")
    schema_prefix = "kitconcept.intranet"

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
    schema_prefix = "kitconcept.intranet"


@adapter(Interface, IBrowserLayer)
@implementer(ISiteEndpointExpander)
class IntranetSiteEndpointExpander:
    def __init__(self, context, request):
        self.context = context
        self.request = request

    def __call__(self, data):
        registry = getUtility(IRegistry)
        settings = registry.forInterface(
            IIntranetSettings, prefix="kitconcept.intranet"
        )
        data["kitconcept.intranet.external_search_url"] = settings.external_search_url
        data["kitconcept.intranet.search_field_placeholder"] = (
            settings.search_field_placeholder
        )
        data["kitconcept.intranet.custom_css"] = settings.custom_css
