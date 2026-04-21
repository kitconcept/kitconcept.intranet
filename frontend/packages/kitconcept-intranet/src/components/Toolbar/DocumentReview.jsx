import { useDispatch, useSelector } from 'react-redux';
import { useIntl, defineMessages } from 'react-intl';
import { toast } from 'react-toastify';

import { approveReview } from '../../actions';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import Toast from '@plone/volto/components/manage/Toast/Toast';

const messages = defineMessages({
  markAsReviewed: {
    id: 'Mark as Reviewed',
    defaultMessage: 'Mark as Reviewed',
  },
  markChangesRequired: {
    id: 'Mark Changes Required',
    defaultMessage: 'Mark Changes Required',
  },
  delegateReviewUpdate: {
    id: 'Delegate Review Update',
    defaultMessage: 'Delegate Review Update',
  },
  postponeReview: {
    id: 'Postpone Review',
    defaultMessage: 'Postpone Review',
  },
  documentReview: {
    id: 'Document Review',
    defaultMessage: 'Document Review',
  },
  success: {
    id: 'Success',
    defaultMessage: 'Success',
  },
  last_updated: {
    id: 'Last updated',
    defaultMessage: 'Last updated',
  },
  next_review: {
    id: 'Next review',
    defaultMessage: 'Next review',
  },
  messageReviewed: {
    id: 'Content marked as reviewed',
    defaultMessage: 'Content marked as reviewed',
  },
});

const DocumentReview = (props) => {
  const dispatch = useDispatch();
  const content = useSelector((state) => state.content.data);
  const intl = useIntl();
  const handleMarkAsReviewed = () => {
    dispatch(approveReview(flattenToAppURL(content['@id']))).then(() => {
      props.closeMenu();
      toast.success(
        <Toast
          success
          title={intl.formatMessage(messages.success)}
          content={intl.formatMessage(messages.messageReviewed)}
        />,
      );
    });
  };
  return (
    <div className="pastanaga-menu-list review-menu">
      <ul>
        <li>
          <button
            onClick={() => {
              handleMarkAsReviewed();
            }}
          >
            {intl.formatMessage(messages.markAsReviewed)}
          </button>
        </li>
        <li>
          <button onClick={() => {}}>
            {intl.formatMessage(messages.markChangesRequired)}
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              props.openReviewSidebar('DelegateReview');
              props.closeMenu();
            }}
          >
            {intl.formatMessage(messages.delegateReviewUpdate)}
          </button>
        </li>

        <li>
          <button
            onClick={() => {
              props.openReviewSidebar('PostponeReview');
              props.closeMenu();
            }}
          >
            {intl.formatMessage(messages.postponeReview)}
          </button>
        </li>
        <div className="review-info">
          <div className="review-info-labels">
            <p>{intl.formatMessage(messages.last_updated)}:</p>
            <p>{intl.formatMessage(messages.next_review)}:</p>
          </div>
          <div className="review-info-values">
            <p>{content?.review_completed_date ?? 'dd-mm-yyyy'}</p>
            <p className="due_date">{content?.review_due_date}</p>
          </div>
        </div>
      </ul>
    </div>
  );
};

export default DocumentReview;
