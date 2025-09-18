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
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary


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

    person_picture_aspect_ratio = schema.Choice(
        title=_("Person Picture Aspect Ratio"),
        description=_(
            "help_person_picture_aspect_ratio",
            default="Image aspect ratio of the person's picture. This setting is used "
            "for the person picture on the person profile page, on teasers that point "
            "to a person profile page and on listings where persons are displayed.",
        ),
        required=True,
        default="rounded1to1",
        vocabulary=SimpleVocabulary([
            SimpleTerm("rounded1to1", "rounded1to1", _("1:1 round picture")),
            SimpleTerm("squared4to5", "squared4to5", _("4:5 square picture")),
        ]),
    )

    iframe_allowed_domains = schema.List(
        title=_("Allowed Iframe Domains"),
        description="A list of allowed domains for iframes. Example: ['example.com']",
        value_type=schema.TextLine(
            title="Domain", description="Allowed domain", default="example.com"
        ),
        required=False,
        defaultFactory=list,
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
        data["kitconcept.person_picture_aspect_ratio"] = (
            settings.person_picture_aspect_ratio
        )
        data["kitconcept.intranet.iframe_allowed_domains"] = (
            settings.iframe_allowed_domains
        )
