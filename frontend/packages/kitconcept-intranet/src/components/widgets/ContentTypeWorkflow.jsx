import { Select, SelectItem, Table } from '@plone/components';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { defineMessages, useIntl } from 'react-intl';

export const NO_WORKFLOW = '[none]';

const messages = defineMessages({
  labelSelect: {
    id: 'New workflow',
    defaultMessage: 'New workflow',
  },
  noWorkflow: {
    id: 'No workflow',
    defaultMessage: 'No workflow',
  },
  default: {
    id: '(Default)',
    defaultMessage: '(Default)',
  },
  descriptionSelect: {
    id: 'The workflow controls which states items of this type can be in and who can view or edit them in each state. If no workflow is set, the visibility of items of this type is determined by the folder they are in.',
    defaultMessage:
      'The workflow controls which states items of this type can be in and who can view or edit them in each state. If no workflow is set, the visibility of items of this type is determined by the folder they are in.',
  },
  descriptionStateMap: {
    id: 'Choose the new state for existing items in each current state. The change is applied when you save.',
    defaultMessage:
      'Choose the new state for existing items in each current state. The change is applied when you save.',
  },
  oldState: { id: 'Current state', defaultMessage: 'Current state' },
  newState: { id: 'New state', defaultMessage: 'New state' },
  loadError: {
    id: 'The workflow settings could not be loaded.',
    defaultMessage: 'The workflow settings could not be loaded.',
  },
});

// Messages used by the content type control panel customization, which is
// not scanned by the i18n extraction
export const workflowMessages = defineMessages({
  workflow: {
    id: 'Workflow',
    defaultMessage: 'Workflow',
  },
  error: {
    id: 'Error',
    defaultMessage: 'Error',
  },
  workflowError: {
    id: 'The workflow for this content type could not be updated.',
    defaultMessage: 'The workflow for this content type could not be updated.',
  },
  confirmWorkflowHeader: {
    id: 'Change workflow?',
    defaultMessage: 'Change workflow?',
  },
  confirmWorkflowContent: {
    id: 'Changing the workflow updates the state and permissions of all existing items of this type according to the selected state mapping. This cannot be undone automatically.',
    defaultMessage:
      'Changing the workflow updates the state and permissions of all existing items of this type according to the selected state mapping. This cannot be undone automatically.',
  },
  confirmWorkflowButton: {
    id: 'Change workflow',
    defaultMessage: 'Change workflow',
  },
});

/**
 * Widget to change the workflow of a content type.
 *
 * It does not save anything by itself: it reports the pending change as
 * `{ old, new, stateMap }` through `onChange`, and the content type control
 * panel sends it to `@type-workflow` when the form is saved.
 */
export default function ContentTypeWorkflow({ id, onChange }) {
  const intl = useIntl();
  const dispatch = useDispatch();
  const typeId = useLocation().pathname.split('/').at(-1);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    let cancelled = false;
    dispatch({
      type: 'GET_TYPE_WORKFLOW',
      request: { op: 'get', path: `/@type-workflow/${typeId}` },
    })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setSelected(res.current.workflow);
        setOverrides({});
        setLoadError(false);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, typeId]);

  if (loadError) {
    return (
      <div className="widget-wrapper">
        <p className="custom-description">
          {intl.formatMessage(messages.loadError)}
        </p>
      </div>
    );
  }

  if (!data) {
    return <div className="widget-wrapper" />;
  }

  const workflows = data.workflows ?? [];
  const current = data.current.workflow;
  const findWorkflow = (token) => workflows.find((wf) => wf.token === token);

  // Items of a type without workflow have no state: they are mapped with the
  // NO_WORKFLOW key, which the backend translates into the "no state" entry.
  const oldStates =
    current === NO_WORKFLOW
      ? [{ id: NO_WORKFLOW, title: intl.formatMessage(messages.noWorkflow) }]
      : findWorkflow(current)?.states ?? [];

  const targetFor = (state, wfToken, stateOverrides) => {
    const newWf = findWorkflow(wfToken);
    if (!newWf) return null;
    const newIds = newWf.states.map((s) => s.id);
    if (newIds.includes(stateOverrides[state.id])) {
      return stateOverrides[state.id];
    }
    return newIds.includes(state.id) ? state.id : newWf.initial_state;
  };

  const emit = (wfToken, stateOverrides) => {
    if (wfToken === current) {
      onChange(id, undefined);
      return;
    }
    const stateMap =
      wfToken === NO_WORKFLOW
        ? {}
        : Object.fromEntries(
            oldStates.map((s) => [s.id, targetFor(s, wfToken, stateOverrides)]),
          );
    onChange(id, { old: current, new: wfToken, stateMap });
  };

  const onSelectWorkflow = (key) => {
    // State choices made for another workflow don't apply to this one
    setSelected(key);
    setOverrides({});
    emit(key, {});
  };

  const onSelectState = (stateId, key) => {
    const next = { ...overrides, [stateId]: key };
    setOverrides(next);
    emit(selected, next);
  };

  const showStateMap =
    selected !== current && selected !== NO_WORKFLOW && oldStates.length > 0;

  return (
    <div className="widget-wrapper">
      <div className="workflow-field">
        <p className="custom-label">
          {intl.formatMessage(messages.labelSelect)}
        </p>
        <Select
          className="workflow-select"
          aria-label={intl.formatMessage(messages.labelSelect)}
          value={selected}
          onChange={onSelectWorkflow}
        >
          {workflows.map((wf) => (
            <SelectItem key={wf.token} id={wf.token}>
              {wf.token === data.default
                ? `${wf.title} ${intl.formatMessage(messages.default)}`
                : wf.title}
            </SelectItem>
          ))}
          <SelectItem key={NO_WORKFLOW} id={NO_WORKFLOW}>
            {intl.formatMessage(messages.noWorkflow)}
          </SelectItem>
        </Select>
      </div>
      <p className="custom-description">
        {intl.formatMessage(messages.descriptionSelect)}
      </p>
      {showStateMap && (
        <>
          <p className="custom-description">
            {intl.formatMessage(messages.descriptionStateMap)}
          </p>
          <Table
            className="workflow-state-map"
            aria-label={intl.formatMessage(messages.newState)}
            columns={[
              {
                id: 'oldState',
                name: intl.formatMessage(messages.oldState),
                isRowHeader: true,
              },
              { id: 'newState', name: intl.formatMessage(messages.newState) },
            ]}
            rows={oldStates.map((oldState) => ({
              id: oldState.id,
              textValue: oldState.title,
              oldState: oldState.title,
              newState: (
                <Select
                  className="workflow-state-map-select"
                  aria-label={`${intl.formatMessage(messages.newState)}: ${oldState.title}`}
                  value={targetFor(oldState, selected, overrides)}
                  onChange={(key) => onSelectState(oldState.id, key)}
                >
                  {findWorkflow(selected)?.states.map((s) => (
                    <SelectItem key={s.id} id={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </Select>
              ),
            }))}
          />
        </>
      )}
    </div>
  );
}
