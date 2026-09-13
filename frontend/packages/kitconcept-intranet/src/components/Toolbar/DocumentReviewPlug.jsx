import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import { Button, DialogTrigger, Popover } from 'react-aria-components';
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
  const site = useSelector((state) => state.site.data);
  const enableContentReview = site['kitconcept.intranet.enable_content_review'];
  const content = useSelector((state) => state.content?.data);
  const [reviewType, setReviewType] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (e.target.closest('.review-popover')) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    document.addEventListener('mousedown', onDocMouseDown, true);
    return () =>
      document.removeEventListener('mousedown', onDocMouseDown, true);
  }, [isOpen]);

  if (!enableContentReview) return null;

  return (
    <>
      <Plug
        pluggable="toolbar-more-menu-list"
        order={10}
        dependencies={[content?.review_state]}
      >
        <li>
          <DialogTrigger onOpenChange={setIsOpen}>
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
              isNonModal
              aria-label={intl.formatMessage(messages.documentReview)}
            >
              <DocumentReview openReviewSidebar={setReviewType} />
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
