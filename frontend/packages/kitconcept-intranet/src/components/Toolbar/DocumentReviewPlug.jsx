import { useState } from 'react';
import { useSelector } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import { Button, DialogTrigger, Popover, Dialog } from 'react-aria-components';
import { Plug } from '@plone/volto/components/manage/Pluggable';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import rightArrowSVG from '@plone/volto/icons/right-key.svg';
import DocumentReview from '@kitconcept/intranet/components/Toolbar/DocumentReview';
import ReviewSidebar from '@kitconcept/intranet/components/ContentReviewSidebar/ReviewSidebar';

const messages = defineMessages({
  review: {
    id: 'Review',
    defaultMessage: 'Review',
  },
  documentReview: {
    id: 'Document Review',
    defaultMessage: 'Document Review',
  },
});

const DocumentReviewPlug = () => {
  const intl = useIntl();
  const content = useSelector((state) => state.content?.data);
  const [reviewType, setReviewType] = useState(null);

  return (
    <>
      <Plug
        pluggable="toolbar-more-menu-list"
        order={10}
        dependencies={[content?.review_state]}
      >
        <li>
          <DialogTrigger>
            <Button
              className="document-review-option"
              aria-label={intl.formatMessage(messages.review)}
              isDisabled={content?.review_state !== 'published'}
            >
              {intl.formatMessage(messages.review)}
              <Icon name={rightArrowSVG} size="24px" />
            </Button>
            <Popover
              className="review-popover"
              placement="end top"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Dialog
                className="document-review-dialog"
                aria-label={intl.formatMessage(messages.documentReview)}
              >
                <DocumentReview openReviewSidebar={setReviewType} />
              </Dialog>
            </Popover>
          </DialogTrigger>
        </li>
      </Plug>
      {reviewType && (
        <ReviewSidebar
          review={reviewType}
          content={content}
          onClose={() => setReviewType(null)}
        />
      )}
    </>
  );
};

export default DocumentReviewPlug;
