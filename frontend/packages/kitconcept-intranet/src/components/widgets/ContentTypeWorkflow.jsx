import { Button, Select, SelectItem, Table } from '@plone/components';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { defineMessages, useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { Toast } from '@plone/components';

const messages = defineMessages({
  labelSelect: {
    id: 'label_select',
    defaultMessage: 'New workflow',
  },
  buttonSave: {
    id: 'save',
    defaultMessage: 'Save',
  },
  noWorkflow: {
    id: 'No workflow',
    defaultMessage: 'No workflow',
  },
  descriptionSelect: {
    id: 'The workflow controls which states items of this type can be in and who can view or edit them in each state. If no workflow is set, the visibility of items of this type is determined by the folder they are in.',
    defaultMessage:
      'The workflow controls which states items of this type can be in and who can view or edit them in each state. If no workflow is set, the visibility of items of this type is determined by the folder they are in.',
  },
  oldState: { id: 'Current state', defaultMessage: 'Current state' },
  newState: { id: 'New state', defaultMessage: 'New state' },
  successTitle: { id: 'Success', defaultMessage: 'Success' },
  successContent: {
    id: 'Workflow updated.',
    defaultMessage: 'The workflow for this content type has been updated.',
  },
  errorTitle: { id: 'Error', defaultMessage: 'Error' },
  errorContent: {
    id: 'Workflow could not be updated.',
    defaultMessage:
      'The workflow for this content type could not be updated. Please try again.',
  },
});

export default function ContentTypeWorkflow() {
  const intl = useIntl();
  const dispatch = useDispatch();
  const typeId = useLocation().pathname.split('/').at(-1);
  const [data, setData] = useState({});
  const [defaultWf, setDefaultWf] = useState('');
  const [workflows, setWorkflows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    dispatch({
      type: 'GET_TYPE_WORKFLOW',
      request: { op: 'get', path: `/@type-workflow/${typeId}` },
    }).then((res) => {
      setData(res);
      setWorkflows(res.workflows);
      setDefaultWf(res.default);
      setSelected(res.current.workflow);
    });
  }, [dispatch, typeId, reloadKey]);

  const isChanged = data?.current?.workflow !== selected;

  const handleSave = () => {
    const oldStates =
      workflows.find((wf) => wf.token === data?.current?.workflow)?.states ??
      [];

    const stateMap =
      selected === '[none]'
        ? {}
        : Object.fromEntries(oldStates.map((s) => [s.id, targetFor(s)]));

    dispatch({
      type: 'POST_TYPE_WORKFLOW',
      request: {
        op: 'patch',
        path: `/@type-workflow/${typeId}`,
        data: { old: data.token, new: selected, stateMap: stateMap },
      },
    })
      .then(() => {
        toast.success(
          <Toast
            title={intl.formatMessage(messages.successTitle)}
            content={intl.formatMessage(messages.successContent)}
          />,
        );
        setReloadKey((k) => k + 1);
      })
      .catch(() => {
        toast.error(
          <Toast
            error
            title={intl.formatMessage(messages.errorTitle)}
            content={intl.formatMessage(messages.errorContent)}
          />,
        );
      });
  };

  const suggest = (state) => {
    const newIds = workflows
      .find((wf) => wf.token === selected)
      ?.states.map((s) => s.id);
    return newIds.includes(state.id)
      ? state.id
      : selected.initial_state ?? newIds[0];
  };

  const targetFor = (state) =>
    overrides[state.id] ??
    (selected && selected !== '[none]' ? suggest(state) : null);

  return (
    <div className="widget-wrapper">
      <div className="workflow-field">
        <p className="custom-label">
          {intl.formatMessage(messages.labelSelect)}
        </p>
        <Select
          className="workflow-select"
          value={selected}
          onChange={(key) => setSelected(key)}
        >
          {workflows?.map((wf) => (
            <SelectItem key={wf.token} id={wf.token}>
              {wf.title} {wf.token === defaultWf ? '(Default)' : ''}
            </SelectItem>
          ))}
          <SelectItem key="none" id="[none]">
            {intl.formatMessage(messages.noWorkflow)}
          </SelectItem>
        </Select>
      </div>
      <p className="custom-description">
        {intl.formatMessage(messages.descriptionSelect)}
      </p>
      {isChanged && selected !== '[none]' && (
        <Table
          className="workflow-state-map"
          columns={[
            {
              id: 'oldState',
              name: intl.formatMessage(messages.oldState),
              isRowHeader: true,
            },
            { id: 'newState', name: intl.formatMessage(messages.newState) },
          ]}
          rows={workflows
            .find((wf) => wf.token === data?.current?.workflow)
            ?.states.map((oldState) => ({
              id: oldState.id,
              textValue: oldState.title,
              oldState: oldState.title,
              newState: (
                <Select
                  className="workflow-state-map-select"
                  aria-label={`${intl.formatMessage(messages.newState)}: ${oldState.title}`}
                  value={targetFor(oldState)}
                  onChange={(key) =>
                    setOverrides((prev) => ({ ...prev, [oldState.id]: key }))
                  }
                >
                  {workflows
                    .find((wf) => wf.token === selected)
                    ?.states.map((s) => (
                      <SelectItem key={s.id} id={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                </Select>
              ),
            }))}
        />
      )}
      <Button
        className="react-aria-Button workflow-save"
        isDisabled={!isChanged}
        onPress={handleSave}
      >
        {intl.formatMessage(messages.buttonSave)}
      </Button>
    </div>
  );
}
