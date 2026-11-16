/**
 * OVERRIDE ContentType.jsx
 * REASON: Added a new tab to the controlpanel to change workflow per content type.
 *   The workflow change is saved with the toolbar Save button, after confirmation.
 * FILE: https://github.com/plone/volto/blob/19.5.0/packages/volto/src/components/manage/Controlpanels/ContentType.jsx
 * FILE VERSION: Volto 19.5.0
 * PULL REQUEST: https://github.com/kitconcept/kitconcept.intranet/pull/555, https://github.com/kitconcept/kitconcept.intranet/pull/565
 * DATE: 2026-10-13
 * DEVELOPER: @jnptk
 */
import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { getParentUrl } from '@plone/volto/helpers/Url/Url';
import { createPortal } from 'react-dom';
import { Button, Confirm, Header } from 'semantic-ui-react';
import { defineMessages, useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import last from 'lodash/last';
import nth from 'lodash/nth';
import join from 'lodash/join';
import Error from '@plone/volto/components/theme/Error/Error';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import Toolbar from '@plone/volto/components/manage/Toolbar/Toolbar';
import Toast from '@plone/volto/components/manage/Toast/Toast';
import { Form } from '@plone/volto/components/manage/Form';
import {
  getControlpanel,
  updateControlpanel,
} from '@plone/volto/actions/controlpanels/controlpanels';
import { useClient } from '@plone/volto/hooks/client/useClient';
/* START CUSTOMIZATION */
import { workflowMessages } from '@kitconcept/intranet/components/widgets/ContentTypeWorkflow';
/* END CUSTOMIZATION */

import saveSVG from '@plone/volto/icons/save.svg';
import clearSVG from '@plone/volto/icons/clear.svg';

const messages = defineMessages({
  title: {
    id: '{id} Content Type',
    defaultMessage: '{id} Content Type',
  },
  changesSaved: {
    id: 'Changes saved.',
    defaultMessage: 'Changes saved.',
  },
  back: {
    id: 'Back',
    defaultMessage: 'Back',
  },
  save: {
    id: 'Save',
    defaultMessage: 'Save',
  },
  cancel: {
    id: 'Cancel',
    defaultMessage: 'Cancel',
  },
  info: {
    id: 'Info',
    defaultMessage: 'Info',
  },
});

function ContentType() {
  const dispatch = useDispatch();
  const intl = useIntl();
  const isClient = useClient();
  const history = useHistory();
  const pathname = useLocation().pathname;

  const controlpanel = useSelector((state) => state.controlpanels.controlpanel);
  const cpanelRequest = useSelector((state) => state.controlpanels);

  const id = last(pathname.split('/'));
  const parent = nth(pathname.split('/'), -2);

  const [visual] = useState(false);
  const [error, setError] = useState(null);

  const form = useRef(null);

  /* START CUSTOMIZATION */
  // Pending submit waiting for the workflow change confirmation
  const [pendingSubmit, setPendingSubmit] = useState(null);
  // Remounts the form (and the workflow widget) after a workflow change
  const [formKey, setFormKey] = useState(0);
  /* END CUSTOMIZATION */

  useEffect(() => {
    dispatch(getControlpanel(join([parent, id], '/'))).catch((err) => {
      setError(err);
    });
  }, [dispatch, parent, id]);

  /* START CUSTOMIZATION */
  const save = async ({ settings, workflow }) => {
    try {
      // Without a workflow change, keep the original behavior
      if (
        controlpanel?.['@id'] &&
        (!workflow || Object.keys(settings).length)
      ) {
        await dispatch(updateControlpanel(controlpanel['@id'], settings));
      }
      if (workflow) {
        await dispatch({
          type: 'PATCH_TYPE_WORKFLOW',
          request: {
            op: 'patch',
            path: `/@type-workflow/${id}`,
            data: workflow,
          },
        });
        // Reload the saved settings and the workflow widget
        await dispatch(getControlpanel(join([parent, id], '/')));
        setFormKey((key) => key + 1);
      }
      toast.info(
        <Toast
          info
          title={intl.formatMessage(messages.info)}
          content={intl.formatMessage(messages.changesSaved)}
        />,
      );
    } catch (err) {
      toast.error(
        <Toast
          error
          title={intl.formatMessage(workflowMessages.error)}
          content={
            err?.response?.body?.message ??
            intl.formatMessage(workflowMessages.workflowError)
          }
        />,
      );
    }
  };

  const onSubmit = (data) => {
    const { __workflow: workflow, ...settings } = data;
    if (workflow) {
      setPendingSubmit({ settings, workflow });
    } else {
      save({ settings });
    }
  };
  /* END CUSTOMIZATION */

  const onCancel = () => {
    history.push(getParentUrl(pathname));
  };

  if (error) {
    return <Error error={error} />;
  }

  if (controlpanel?.data) {
    const localControlpanel = {
      ...controlpanel,
      data: {
        ...controlpanel.data,
      },
    };

    if (localControlpanel?.data?.filter_content_types === false) {
      localControlpanel.data.filter_content_types = {
        title: 'all',
        token: 'all',
      };
    }
    if (localControlpanel?.data?.filter_content_types === true) {
      if ((localControlpanel?.data?.allowed_content_types || []).length) {
        localControlpanel.data.filter_content_types = {
          title: 'some',
          token: 'some',
        };
      } else {
        localControlpanel.data.filter_content_types = {
          title: 'none',
          token: 'none',
        };
      }
    }

    /* START CUSTOMIZATION */
    const schemaWithWorkflow = {
      ...localControlpanel.schema,
      fieldsets: [
        ...localControlpanel.schema.fieldsets,
        {
          id: 'workflow',
          title: intl.formatMessage(workflowMessages.workflow),
          fields: ['__workflow'],
        },
      ],
      properties: {
        ...localControlpanel.schema.properties,
        __workflow: {
          title: intl.formatMessage(workflowMessages.workflow),
          widget: 'contentTypeWorkflow',
        },
      },
    };
    /* END CUSTOMIZATION */

    return (
      <div id="page-controlpanel" className="ui container dexterity-types">
        <Header disabled>
          {intl.formatMessage(messages.title, {
            id: localControlpanel.title,
          })}
        </Header>
        {/* START CUSTOMIZATION */}
        <Confirm
          open={!!pendingSubmit}
          header={intl.formatMessage(workflowMessages.confirmWorkflowHeader)}
          content={
            <div className="content">
              {intl.formatMessage(workflowMessages.confirmWorkflowContent)}
            </div>
          }
          cancelButton={intl.formatMessage(messages.cancel)}
          confirmButton={intl.formatMessage(
            workflowMessages.confirmWorkflowButton,
          )}
          onCancel={() => setPendingSubmit(null)}
          onConfirm={() => {
            const submit = pendingSubmit;
            setPendingSubmit(null);
            save(submit);
          }}
        />
        {/* END CUSTOMIZATION */}
        <Form
          key={formKey}
          isEditForm
          ref={form}
          schema={schemaWithWorkflow} // localControlpanel.schema
          formData={localControlpanel.data}
          onSubmit={onSubmit}
          onCancel={onCancel}
          pathname={pathname}
          visual={visual}
          hideActions
          loading={cpanelRequest.update?.loading}
        />
        {isClient &&
          createPortal(
            <Toolbar
              pathname={pathname}
              hideDefaultViewButtons
              inner={
                <>
                  <Button
                    id="toolbar-save"
                    className="save"
                    aria-label={intl.formatMessage(messages.save)}
                    onClick={() => form.current.onSubmit()}
                    disabled={cpanelRequest.update?.loading}
                    loading={cpanelRequest.update?.loading}
                  >
                    <Icon
                      name={saveSVG}
                      className="circled"
                      size="30px"
                      title={intl.formatMessage(messages.save)}
                    />
                  </Button>
                  <Button
                    className="cancel"
                    aria-label={intl.formatMessage(messages.cancel)}
                    onClick={() => onCancel()}
                  >
                    <Icon
                      name={clearSVG}
                      className="circled"
                      size="30px"
                      title={intl.formatMessage(messages.cancel)}
                    />
                  </Button>
                </>
              }
            />,
            document.getElementById('toolbar'),
          )}
      </div>
    );
  }
  return <div />;
}

export default ContentType;
