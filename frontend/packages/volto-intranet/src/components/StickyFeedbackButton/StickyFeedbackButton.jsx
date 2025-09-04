import { useIntl, defineMessages } from 'react-intl';
import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { Link, useLocation } from 'react-router-dom';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import FeedbackButtonBackground from '../../icons/feedback-button-background.svg';
import FeedbackButtonLike from '../../icons/feedback-button-like.svg';

const messages = defineMessages({
  FeedbackText: {
    id: 'Feedback on this page',
    defaultMessage: 'Feedback on this page',
  },
});

const StickyFeedbackButton = () => {
  const intl = useIntl();
  const location = useLocation();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setAnimate(true);
      }
    };

    const timer = setTimeout(() => setAnimate(true), 4000);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [location.pathname]);

  useEffect(() => {
    setAnimate(false);
  }, [location.pathname]);

  return (
    <div
      className={cx('sticky-feedback-button-container', {
        animate,
      })}
      style={{ transform: 'translateX(-100%) translateY(-50%)' }}
    >
      <Link
        to={`${location.pathname.replace(/\/$/, '')}/feedback-form`}
        className={'sticky-button'}
      >
        <div className="icon-container">
          <Icon
            key="background"
            title="feedbackButton"
            name={FeedbackButtonBackground}
            color="#4E4E4E"
            size={160}
          />
          <Icon
            key="like-button"
            title="feedbackButton"
            className="feedback-button-like"
            name={FeedbackButtonLike}
            size={33}
            color="#fff"
          />
          <h3 className="title">{intl.formatMessage(messages.FeedbackText)}</h3>
        </div>
      </Link>
    </div>
  );
};

export default StickyFeedbackButton;
