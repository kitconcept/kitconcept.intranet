import { Button, Select, SelectItem } from '@plone/components';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getVocabulary } from '@plone/volto/actions/vocabularies/vocabularies';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  label_select: {
    id: 'label_select',
    defaultMessage: 'New workflow',
  },
  save: {
    id: 'save',
    defaultMessage: 'Save',
  },
  no_workflow: {
    id: 'No workflow',
    defaultMessage: 'No workflow',
  },
  description_select: {
    id: 'The workflow controls which states items of this type can be in and who can view or edit them in each state. If no workflow is set, the visibility of items of this type is determined by the folder they are in.',
    defaultMessage:
      'The workflow controls which states items of this type can be in and who can view or edit them in each state. If no workflow is set, the visibility of items of this type is determined by the folder they are in.',
  },
});

export default function ContentTypeWorkflow() {
  const intl = useIntl();
  const dispatch = useDispatch();
  const vocabName = 'plone.app.vocabularies.Workflows';
  const workflows = useSelector((state) => state.vocabularies[vocabName]);
  const typeId = useLocation().pathname.split('/').at(-1);
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    dispatch(getVocabulary({ vocabNameOrURL: vocabName }));
    dispatch({
      type: 'GET_TYPE_WORKFLOW',
      request: { op: 'get', path: `/@type-workflow/${typeId}` },
    }).then((res) => {
      setData(res);
      setSelected(res.token);
    });
  }, [dispatch, typeId]);

  const isChanged = selected !== data?.token;

  const handleSave = () => {
    dispatch({
      type: 'POST_TYPE_WORKFLOW',
      request: {
        op: 'patch',
        path: `/@type-workflow/${typeId}`,
        data: { old: data.token, new: selected },
      },
    });
  };

  return (
    <div className="widget-wrapper">
      <div className="workflow-field">
        <p className="custom-label">
          {intl.formatMessage(messages.label_select)}
        </p>
        <Select
          className="workflow-select"
          value={selected}
          onChange={(key) => setSelected(key)}
        >
          {workflows?.items?.map((wf) => (
            <SelectItem key={wf.value} id={wf.value}>
              {wf.label}
            </SelectItem>
          ))}
          <SelectItem key="none" id="[none]">
            {intl.formatMessage(messages.no_workflow)}
          </SelectItem>
        </Select>
      </div>
      <p className="custom-description">
        {intl.formatMessage(messages.description_select)}
      </p>
      <Button
        className="react-aria-Button workflow-save"
        isDisabled={!isChanged}
        onPress={handleSave}
      >
        {intl.formatMessage(messages.save)}
      </Button>
    </div>
  );
}
