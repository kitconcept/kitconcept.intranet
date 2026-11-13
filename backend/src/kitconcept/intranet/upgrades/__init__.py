from plone.dexterity.interfaces import IDexterityFTI
from zope.component import queryUtility


def add_behavior(portal_type, behavior):
    fti = queryUtility(IDexterityFTI, name=portal_type)
    new = [
        currentbehavior
        for currentbehavior in fti.behaviors
        if currentbehavior != behavior
    ]
    new.append(behavior)
    fti.behaviors = tuple(new)


def prepend_behavior(portal_type, behavior):
    fti = queryUtility(IDexterityFTI, name=portal_type)
    new = [
        currentbehavior
        for currentbehavior in fti.behaviors
        if currentbehavior != behavior
    ]
    new.insert(0, behavior)
    fti.behaviors = tuple(new)


def remove_behavior(portal_type, behavior):
    fti = queryUtility(IDexterityFTI, name=portal_type)
    if fti is not None:
        new = [
            currentbehavior
            for currentbehavior in fti.behaviors
            if currentbehavior != behavior
        ]
        fti.behaviors = tuple(new)


def remove_preview_image_behavior(context):
    REMOVE_PREVIEW_IMAGE_BEHAVIOR = ["Document", "News Item", "Event"]
    for type_ in REMOVE_PREVIEW_IMAGE_BEHAVIOR:
        remove_behavior(type_, "volto.preview_image")

    # Remove leadimage behavior from News Item
    remove_behavior("News Item", "plone.leadimage")


DASHBOARD_MODEL_SOURCE = """<model xmlns:i18n="http://xml.zope.org/namespaces/i18n" xmlns:marshal="http://namespaces.plone.org/supermodel/marshal" xmlns:form="http://namespaces.plone.org/supermodel/form" xmlns:security="http://namespaces.plone.org/supermodel/security" xmlns:indexer="http://namespaces.plone.org/supermodel/indexer" xmlns:lingua="http://namespaces.plone.org/supermodel/lingua" xmlns:users="http://namespaces.plone.org/supermodel/users" xmlns="http://namespaces.plone.org/supermodel/schema">
    <schema>
      <fieldset name="layout" label="Layout">
        <field name="blocks" type="plone.schema.jsonfield.JSONField">
          <default>{'6b5c3a1e-2f4d-4c8a-9e7b-1d2f3a4b5c6d': {'@type': 'title'}, 'c1069b10-3a69-4fd2-a104-d1424521b8dc': {'@type': 'slate'}, '217c858b-df5e-4c05-9211-0287c1af368e': {'@type': 'gridBlock', 'blocks': {'d7bcf88b-6780-4aea-81b0-07e1a906b085': {'@type': 'listing', 'headline': 'Recently modified', 'headlineTag': 'h2', 'querystring': {'limit': '5', 'query': [{'i': 'portal_type', 'o': 'plone.app.querystring.operation.selection.none', 'v': ['Dashboard', 'Image']}], 'sort_on': 'modified', 'sort_order': 'descending', 'sort_order_boolean': True}, 'variation': 'default'}, '805761ea-9424-44a4-a545-041089f5cab8': {'@type': 'listing', 'headline': 'Recently created', 'headlineTag': 'h2', 'querystring': {'limit': '5', 'query': [{'i': 'portal_type', 'o': 'plone.app.querystring.operation.selection.none', 'v': ['Dashboard', 'Image']}], 'sort_on': 'created', 'sort_order': 'descending', 'sort_order_boolean': True}, 'variation': 'default'}}, 'blocks_layout': {'items': ['d7bcf88b-6780-4aea-81b0-07e1a906b085', '805761ea-9424-44a4-a545-041089f5cab8']}}, 'ee7c408b-d6f4-4a01-aad7-e72cff25ca74': {'@type': 'gridBlock', 'blocks': {'48d26826-77b3-4c03-9339-9dd98621f823': {'@type': 'listing', 'headline': 'Recently created by me', 'headlineTag': 'h2', 'querystring': {'limit': '5', 'query': [{'i': 'portal_type', 'o': 'plone.app.querystring.operation.selection.none', 'v': ['Dashboard', 'Image']}, {'i': 'Creator', 'o': 'plone.app.querystring.operation.string.currentUser', 'v': ''}], 'sort_on': 'created', 'sort_order': 'descending', 'sort_order_boolean': True}, 'variation': 'default'}, '89c27ecf-879e-4b6c-a9f4-c08a644d0bd2': {'@type': 'listing', 'headline': 'My workspaces', 'headlineTag': 'h2', 'querystring': {'limit': '5', 'query': [{'i': 'portal_type', 'o': 'plone.app.querystring.operation.selection.any', 'v': ['Workspace']}, {'i': 'Creator', 'o': 'plone.app.querystring.operation.string.currentUser', 'v': ''}], 'sort_on': 'modified', 'sort_order': 'descending', 'sort_order_boolean': True}, 'variation': 'default'}}, 'blocks_layout': {'items': ['48d26826-77b3-4c03-9339-9dd98621f823', '89c27ecf-879e-4b6c-a9f4-c08a644d0bd2']}}, 'f0ece497-40c1-4429-b0d7-6f8a5d68a229': {'@type': 'gridBlock', 'blocks': {'6536b856-5519-46ea-918e-45895500ed42': {'@type': 'listing', 'headline': 'News from my organisational units', 'headlineTag': 'h2', 'querystring': {'limit': '5', 'query': [{'i': 'portal_type', 'o': 'plone.app.querystring.operation.selection.any', 'v': ['News Item']}, {'i': 'organisational_unit_reference', 'o': 'plone.app.querystring.operation.selection.currentUser', 'v': ''}], 'sort_on': 'effective', 'sort_order': 'descending', 'sort_order_boolean': True}, 'variation': 'default'}, 'df7a4369-ab99-4535-b399-a6b5d72d5ab4': {'@type': 'listing', 'headline': 'Events from my organisational units', 'headlineTag': 'h2', 'querystring': {'limit': '5', 'query': [{'i': 'portal_type', 'o': 'plone.app.querystring.operation.selection.any', 'v': ['Event']}, {'i': 'organisational_unit_reference', 'o': 'plone.app.querystring.operation.selection.currentUser', 'v': ''}, {'i': 'start', 'o': 'plone.app.querystring.operation.date.afterToday', 'v': ''}], 'sort_on': 'start', 'sort_order': 'ascending', 'sort_order_boolean': False}, 'variation': 'default'}}, 'blocks_layout': {'items': ['6536b856-5519-46ea-918e-45895500ed42', 'df7a4369-ab99-4535-b399-a6b5d72d5ab4']}}, '59caa15e-a9d6-4ea9-814f-294698975b48': {'@type': 'gridBlock', 'blocks': {'cef75149-6b7f-4059-b0dc-45d512732c04': {'@type': 'listing', 'headline': 'Submitted for publication', 'headlineTag': 'h2', 'querystring': {'limit': '5', 'query': [{'i': 'review_state', 'o': 'plone.app.querystring.operation.selection.any', 'v': ['pending']}], 'sort_on': 'modified', 'sort_order': 'descending', 'sort_order_boolean': True}, 'variation': 'default'}}, 'blocks_layout': {'items': ['cef75149-6b7f-4059-b0dc-45d512732c04']}}}</default>
          <description/>
          <required>False</required>
          <title>Blocks</title>
        </field>
        <field name="blocks_layout" type="plone.schema.jsonfield.JSONField">
          <default>{'items': ['6b5c3a1e-2f4d-4c8a-9e7b-1d2f3a4b5c6d', 'c1069b10-3a69-4fd2-a104-d1424521b8dc', '217c858b-df5e-4c05-9211-0287c1af368e', 'ee7c408b-d6f4-4a01-aad7-e72cff25ca74', 'f0ece497-40c1-4429-b0d7-6f8a5d68a229', '59caa15e-a9d6-4ea9-814f-294698975b48']}</default>
          <description/>
          <required>False</required>
          <title>Blocks Layout</title>
        </field>
      </fieldset>
    </schema>
  </model>"""  # noqa: E501


def set_dashboard_layout(context):
    """Set the default layout of the Dashboard type once."""
    fti = queryUtility(IDexterityFTI, name="Dashboard")
    if fti is None:
        return
    if fti.model_source and "blocks" in fti.lookupModel().schema:
        return
    # manage_changeProperties fires the event that syncs the generated schema
    fti.manage_changeProperties(model_source=DASHBOARD_MODEL_SOURCE)
