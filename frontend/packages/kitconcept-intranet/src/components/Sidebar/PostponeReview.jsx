import { useState } from 'react';
import { useIntl, defineMessages } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { TextArea, TextField, Label } from 'react-aria-components';
import { Accordion, Button, Form as UiForm, Segment } from 'semantic-ui-react';
import { toast } from 'react-toastify';

import CheckboxWidget from '@plone/volto/components/manage/Widgets/CheckboxWidget';
import Toast from '@plone/volto/components/manage/Toast/Toast';
import DatetimeWidget from '@plone/volto/components/manage/Widgets/DatetimeWidget';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { postponeReview } from '../../actions';

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
    id: 'Postpone the next review date for this content. Select a new date or a time period after which you would like to be reminded again.',
    defaultMessage:
      'Postpone the next review date for this content. Select a new date or a time period after which you would like to be reminded again.',
  },
  comment: {
    id: 'Comment',
    defaultMessage: 'Comment',
  },
  cancel: {
    id: 'Cancel',
    defaultMessage: 'Cancel',
  },
  postoneButton: {
    id: 'Postpone',
    defaultMessage: 'Postpone',
  },
  help: {
    id: 'The check interval is set to %{interval}. To change it, you must edit the content.',
    defaultMessage:
      'The check interval is set to %{interval}. To change it, you must edit the content.',
  },
  success: {
    id: 'Success',
    defaultMessage: 'Success',
  },
  messagePostpone: {
    id: 'Review has been successfully postponed',
    defaultMessage: 'Review has been successfully postponed',
  },
});

const englishPlaceholder =
  'If you wish, you can leave a comment here, for example, the reason for the postponement.';
const germanPlaceholder =
  'Wenn Sie möchten, können Sie hier einen Kommentar hinterlassen, z.B. den Grund für die Verschiebung.';

const PostponeReview = (props) => {
  const { onClose } = props;
  const dispatch = useDispatch();
  const content = useSelector((state) => state.content.data);
  const { review_due_date } = content;
  const [presetReviewInterval, setPresetReviewInterval] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [comment, setComment] = useState('');
  const intl = useIntl();
  const { locale } = useIntl();

  const handleSubmit = () => {
    const data = {};
    if (comment) data.comment = comment;
    if (!presetReviewInterval && dueDate) data.due_date = dueDate;
    if (Object.keys(data).length === 0) return;
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
      <Accordion fluid styled className="form" key="postpone-review">
        <div key="postpone-review" id={`metadataform-fieldset-postpone-review`}>
          <Accordion.Title active={true} index="postpone-review">
            {intl.formatMessage(messages.postponeTitle)}
          </Accordion.Title>
          <Accordion.Content active={true}>
            <Segment className="attached">
              <p>{intl.formatMessage(messages.postponeReview)}</p>
              <CheckboxWidget
                id="usePresetReviewInterval"
                title={intl.formatMessage(messages.usePresetReviewInterval)}
                value={presetReviewInterval}
                onChange={(name, value) => {
                  setPresetReviewInterval(value);
                }}
              />

              <DatetimeWidget
                id="nextReviewDate"
                title="Next Review on"
                fieldSet="default"
                dateOnly={true}
                noPastDates={true}
                isDisabled={presetReviewInterval}
                onChange={(id, value) => setDueDate(value)}
                value={!presetReviewInterval ? dueDate : review_due_date}
              />

              <p className="help">{intl.formatMessage(messages.help)} </p>

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
              <div className="postpone-review-buttons">
                <Button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    onClose();
                  }}
                >
                  {intl.formatMessage(messages.cancel)}
                </Button>
                <Button type="submit" className="postpone-button">
                  {intl.formatMessage(messages.postoneButton)}
                </Button>
              </div>
            </Segment>
          </Accordion.Content>
        </div>
      </Accordion>
    </UiForm>
  );
};

export default PostponeReview;
