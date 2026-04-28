import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl, defineMessages } from 'react-intl';
import {
  Accordion,
  Form as UiForm,
  AccordionItem,
  AccordionPanel,
  Button,
} from '@plone/components';
import { toast } from 'react-toastify';

import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import SelectAutoComplete from '@plone/volto/components/manage/Widgets/SelectAutoComplete';
import { delegateReview } from '../../actions';
import Toast from '@plone/volto/components/manage/Toast/Toast';
import TextareaWidget from '@plone/volto/components/manage/Widgets/TextareaWidget';

const messages = defineMessages({
  comment: {
    id: 'Comment',
    defaultMessage: 'Comment: ',
  },
  delegateReview: {
    id: 'delegateReview',
    defaultMessage:
      'Assign the view or update of this content to another person. Select the responsible person and provide a short description of the task. ',
  },
  delegateTitle: {
    id: 'delegateTitle',
    defaultMessage: 'Delegate Review or Update',
  },
  cancel: {
    id: 'Cancel',
    defaultMessage: 'Cancel',
  },
  delegateButton: {
    id: 'DelegateButton',
    defaultMessage: 'Delegate',
  },
  success: {
    id: 'Success',
    defaultMessage: 'Success',
  },
  messageDelegate: {
    id: 'delegateSuccessful',
    defaultMessage: 'Review has been successfully delegated',
  },
  delegateComment: {
    id: 'delegateComment',
    defaultMessage:
      'If you wish, you can leave a comment for the person incharge here',
  },
  selectAssignee: {
    id: 'Assignee',
    defaultMessage: 'Assignee: *',
  },
  selectAssigneePlaceholder: {
    id: 'SelectAssigneePlaceholder',
    defaultMessage: 'Please Select ...',
  },
  error: {
    id: 'Error',
    defaultMessage: 'Error',
  },
});

const DelegateReview = (props) => {
  const { onClose } = props;
  const dispatch = useDispatch();
  const content = useSelector((state) => state.content.data);
  const [assignee, setAssignee] = useState('');
  const [comment, setComment] = useState('');

  const intl = useIntl();
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {};
    if (comment) data.comment = comment;
    if (assignee) data.assignee = assignee;
    dispatch(delegateReview(flattenToAppURL(content['@id']), data))
      .then(() => {
        onClose();
        toast.success(
          <Toast
            success
            title={intl.formatMessage(messages.success)}
            content={intl.formatMessage(messages.messageDelegate)}
          />,
        );
      })
      .catch((error) => {
        toast.error(
          <Toast
            title={intl.formatMessage(messages.error)}
            content={error.response?.body?.message}
          />,
        );
      });
  };
  return (
    <UiForm
      method="post"
      className="delegate-review-form"
      onSubmit={handleSubmit}
    >
      <Accordion
        className="delegate-form"
        defaultExpandedKeys={['delegate-review']}
      >
        <AccordionItem id="delegate-review">
          <div className="delegate-form-title">
            {intl.formatMessage(messages.delegateTitle)}
          </div>
          <AccordionPanel className="delegate-form-content">
            <p>{intl.formatMessage(messages.delegateReview)}</p>

            <SelectAutoComplete
              id="assignee"
              title={intl.formatMessage(messages.selectAssignee)}
              placeholder={intl.formatMessage(
                messages.selectAssigneePlaceholder,
              )}
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

            <TextareaWidget
              id="review-comment"
              title={intl.formatMessage(messages.comment)}
              fieldSet="default"
              rows={3}
              style={{ height: 'initial' }}
              onChange={(id, value) => setComment(value)}
              value={comment}
              isDisabled={false}
              placeholder={intl.formatMessage(messages.delegateComment)}
            />

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
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </UiForm>
  );
};

export default DelegateReview;
