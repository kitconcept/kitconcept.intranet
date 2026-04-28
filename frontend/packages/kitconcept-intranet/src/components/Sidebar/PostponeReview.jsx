import { useState } from 'react';
import { useIntl, defineMessages } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  Accordion,
  Form as UiForm,
  AccordionItem,
  AccordionPanel,
  Button,
} from '@plone/components';
import CheckboxWidget from '@plone/volto/components/manage/Widgets/CheckboxWidget';
import Toast from '@plone/volto/components/manage/Toast/Toast';
import DatetimeWidget from '@plone/volto/components/manage/Widgets/DatetimeWidget';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { postponeReview } from '../../actions';
import TextareaWidget from '@plone/volto/components/manage/Widgets/TextareaWidget';

const messages = defineMessages({
  usePresetReviewInterval: {
    id: 'Use preset review interval',
    defaultMessage: 'Use preset review interval',
  },
  postponeTitle: {
    id: 'Postpone Review',
    defaultMessage: 'Postpone Review',
  },
  postponeReview: {
    id: 'postponeReview',
    defaultMessage:
      'Postpone the next review date for this content. Select a new date or a time period after which you would like to be reminded again.',
  },
  comment: {
    id: 'Comment',
    defaultMessage: 'Comment:',
  },
  cancel: {
    id: 'Cancel',
    defaultMessage: 'Cancel',
  },
  postponeButton: {
    id: 'Postpone',
    defaultMessage: 'Postpone',
  },
  help: {
    id: 'help',
    defaultMessage:
      'The check interval is set to {interval}. To change it, you must edit the content.',
  },
  success: {
    id: 'Success',
    defaultMessage: 'Success',
  },
  messagePostpone: {
    id: 'Review has been successfully postponed',
    defaultMessage: 'Review has been successfully postponed',
  },
  commentPlaceholder: {
    id: 'commentPlaceholder',
    defaultMessage:
      'If you wish, you can leave a comment here, for example, the reason for the postponement.',
  },
  nextReview: {
    id: 'nextReview',
    defaultMessage: 'Next Review on',
  },
});

const PostponeReview = (props) => {
  const { onClose } = props;
  const dispatch = useDispatch();
  const content = useSelector((state) => state.content.data);
  const { review_due_date, review_interval } = content;
  const [presetReviewInterval, setPresetReviewInterval] = useState(
    Boolean(review_interval),
  );
  const [dueDate, setDueDate] = useState('');
  const [comment, setComment] = useState('');
  const intl = useIntl();

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {};
    if (comment) data.comment = comment;
    if (!presetReviewInterval && dueDate) data.due_date = dueDate;
    dispatch(postponeReview(flattenToAppURL(content['@id']), data)).then(() => {
      onClose();
      toast.success(
        <Toast
          success
          title={intl.formatMessage(messages.success)}
          content={intl.formatMessage(messages.messagePostpone)}
        />,
      );
    });
  };

  return (
    <UiForm
      method="post"
      onSubmit={handleSubmit}
      className="postpone-review-form"
    >
      <Accordion
        className="postpone-form"
        defaultExpandedKeys={['postpone-review']}
      >
        <AccordionItem id="postpone-review">
          <div className="postpone-form-title">
            {intl.formatMessage(messages.postponeTitle)}
          </div>
          <AccordionPanel className="postpone-form-content">
            <p>{intl.formatMessage(messages.postponeReview)}</p>
            <CheckboxWidget
              id="usePresetReviewInterval"
              title={intl.formatMessage(messages.usePresetReviewInterval)}
              value={presetReviewInterval}
              onChange={(name, value) => {
                setPresetReviewInterval(value);
              }}
            />

            <p className="help">
              {intl.formatMessage(messages.help, {
                interval: review_interval?.title ?? '0',
              })}
            </p>
            <DatetimeWidget
              id="nextReviewDate"
              title={intl.formatMessage(messages.nextReview)}
              fieldSet="default"
              dateOnly={true}
              noPastDates={true}
              isDisabled={presetReviewInterval}
              onChange={(id, value) => setDueDate(value)}
              value={!presetReviewInterval ? dueDate : review_due_date}
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
              placeholder={intl.formatMessage(messages.commentPlaceholder)}
            />

            <div className="postpone-review-buttons">
              <Button
                type="button"
                className="cancel-button"
                title={intl.formatMessage(messages.cancel)}
                basic
                onClick={() => {
                  onClose();
                }}
              >
                {intl.formatMessage(messages.cancel)}
              </Button>
              <Button type="submit" basic className="postpone-button">
                {intl.formatMessage(messages.postponeButton)}
              </Button>
            </div>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </UiForm>
  );
};

export default PostponeReview;
