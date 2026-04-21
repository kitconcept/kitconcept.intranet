import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextArea, TextField, Label } from 'react-aria-components';
import { useIntl, defineMessages } from 'react-intl';
import {
  Accordion,
  Button,
  Container as SemanticContainer,
  Form as UiForm,
  Message,
  Segment,
  Tab,
} from 'semantic-ui-react';
import { toast } from 'react-toastify';

import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import SelectAutoComplete from '@plone/volto/components/manage/Widgets/SelectAutoComplete';
import { delegateReview } from '../../actions';
import Toast from '@plone/volto/components/manage/Toast/Toast';

const messages = defineMessages({
  comment: {
    id: 'Comment',
    defaultMessage: 'Comment',
  },
  delegateReview: {
    id: 'Assign the view or update of this content to another person. Select the responsible person and provide a short description of the task',
    defaultMessage:
      'Assign the view or update of this content to another person. Select the responsible person and provide a short description of the task',
  },
  delegateTitle: {
    id: 'Delegate Review',
    defaultMessage: 'Delegate Review',
  },
  cancel: {
    id: 'Cancel',
    defaultMessage: 'Cancel',
  },
  delegateButton: {
    id: 'Delegate',
    defaultMessage: 'Delegate',
  },
  success: {
    id: 'Success',
    defaultMessage: 'Success',
  },
  messageDelegate: {
    id: 'Review has been successfully delegated',
    defaultMessage: 'Review has been successfully delegated',
  },
});
const englishPlaceholder =
  'If you wish, you can leave a comment for the person incharge here';
const germanPlaceholder =
  'Wenn Sie möchten, können Sie hier einen Kommentar für die verantwortliche Person hinterlassen';
const DelegateReview = (props) => {
  const { onClose } = props;
  const dispatch = useDispatch();
  const content = useSelector((state) => state.content.data);
  const [assignee, setAssignee] = useState('');
  const [comment, setComment] = useState('');

  const intl = useIntl();
  const { locale } = useIntl();
  const handleSubmit = () => {
    const data = {};
    if (comment) data.comment = comment;
    if (assignee) data.assignee = assignee;
    if (Object.keys(data).length === 0) return;
    data?.assignee &&
      dispatch(delegateReview(flattenToAppURL(content['@id']), data)).then(
        () => {
          onClose();
          toast.success(
            <Toast
              success
              title={intl.formatMessage(messages.success)}
              content={intl.formatMessage(messages.messageDelegate)}
            />,
          );
        },
      );
  };
  return (
    <UiForm
      method="post"
      className="delegate-review-form"
      onSubmit={() => {
        handleSubmit();
      }}
    >
      <Accordion fluid styled className="form" key="delegate-review">
        <div key="delegate-review" id={`metadataform-fieldset-delegate-review`}>
          <Accordion.Title active={true} index="delegate-review">
            {intl.formatMessage(messages.delegateTitle)}
          </Accordion.Title>
          <Accordion.Content active={true}>
            <Segment className="attached">
              <p>{intl.formatMessage(messages.delegateReview)}</p>

              <SelectAutoComplete
                id="assignee"
                title="Assignee: *"
                placeholder="Please Select . . ."
                value={assignee}
                isMulti={false}
                items={{
                  vocabulary: {
                    '@id': 'plone.app.vocabularies.Users',
                  },
                }}
                onChange={(id, value) => setAssignee(value)}
                wrapped={true}
              />
              <TextField className="comment-field">
                <Label htmlFor="comment" className="comment-label">
                  {intl.formatMessage(messages.comment)}:
                </Label>
                <TextArea
                  id="comment"
                  rows={4}
                  cols={50}
                  style={{ height: 'unset' }}
                  name="comment"
                  className="comment-textarea"
                  onChange={(e) => setComment(e.target.value)}
                  value={comment}
                  placeholder={
                    locale === 'en' ? englishPlaceholder : germanPlaceholder
                  }
                />
              </TextField>
              <div className="delegate-review-buttons ">
                <Button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    onClose();
                  }}
                >
                  {intl.formatMessage(messages.cancel)}
                </Button>
                <Button type="submit" className="delegate-button">
                  {intl.formatMessage(messages.delegateButton)}
                </Button>
              </div>
            </Segment>
          </Accordion.Content>
        </div>
      </Accordion>
    </UiForm>
  );
};

export default DelegateReview;
