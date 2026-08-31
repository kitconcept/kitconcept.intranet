import type { Content } from '@plone/types';
import FormattedDate from '@plone/volto/components/theme/FormattedDate/FormattedDate';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import { expandToBackendURL } from '@plone/volto/helpers/Url/Url';
import { defineMessages, useIntl } from 'react-intl';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import calendarSVG from '@plone/volto/icons/calendar.svg';
import lockSVG from '@plone/volto/icons/lock.svg';
import sendSVG from '@plone/volto/icons/send.svg';
import PersonPill from '@kitconcept/intranet/components/PersonPill/PersonPill';

const messages = defineMessages({
  title: {
    id: 'About this content',
    defaultMessage: 'About this content',
  },
  author: {
    id: 'Author',
    defaultMessage: 'Author',
  },
  responsible: {
    id: 'Content responsible',
    defaultMessage: 'Content responsible',
  },
  created: {
    id: 'Created on',
    defaultMessage: 'Created on',
  },
  modified: {
    id: 'Last modified on',
    defaultMessage: 'Last modified on',
  },
  feedbackPlaceholder: {
    id: 'What is unclear, outdated or missing?',
    defaultMessage: 'What is unclear, outdated or missing?',
  },
  sendFeedback: {
    id: 'Send feedback',
    defaultMessage: 'Send feedback',
  },
  showFeedbackForm: {
    id: 'Give feedback on this page',
    defaultMessage: 'Give feedback on this page',
  },
  feedbackTitle: {
    id: 'Feedback about this page',
    defaultMessage: 'Feedback about this page',
  },
  private: {
    id: 'Private',
    defaultMessage: 'Private',
  },
  goesTo: {
    id: 'goes to',
    defaultMessage: 'goes to',
  },
});

type UserData = {
  fullname?: string;
  homepage?: string | null;
  portrait?: string | null;
};

type ContentWithBylineExpander = Content & {
  created?: string;
  modified?: string;
  '@components'?: {
    byline?: {
      users?: Record<string, UserData>;
    };
    clm?: {
      responsible_person?: {
        person_url?: string;
        url?: string;
        username: string;
        title?: string;
      };
    };
  };
};

type AboutThisContentProps = {
  content: ContentWithBylineExpander;
};

type ReduxState = {
  content: {
    data?: ContentWithBylineExpander;
  };
};

const dateFormat = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
} as const;

type AboutContentDateProps = {
  label: string;
  date: string;
  locale: string;
  className: string;
};

const AboutContentDate = ({
  label,
  date,
  locale,
  className,
}: AboutContentDateProps) => (
  <div className={`about-content-item ${className}`}>
    <h3>{label}</h3>
    <div className="about-content-date">
      <Icon name={calendarSVG} size="28px" />
      <FormattedDate
        className=""
        date={date}
        format={dateFormat}
        includeTime={false}
        locale={locale}
        long={false}
        relative={false}
      >
        {null}
      </FormattedDate>
    </div>
  </div>
);

const AboutThisContent = ({ content }: AboutThisContentProps) => {
  const intl = useIntl();
  const [feedback, setFeedback] = useState('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const contentFromState = useSelector(
    (state: ReduxState) => state.content.data,
  );
  const contentData = contentFromState ?? content;
  const creators = contentData?.creators ?? [];
  const usersFromExpander = contentData?.['@components']?.byline?.users ?? {};
  const creatorsWithData = creators.map((userid: string) => {
    const userData = usersFromExpander[userid];

    return {
      name: userData?.fullname || userid,
      portrait: userData?.portrait,
    };
  });
  const hasAuthors = creatorsWithData.length > 0;
  const responsiblePersonUrl =
    contentData?.['@components']?.clm?.responsible_person?.person_url;
  const responsiblePersonUsername =
    contentData?.['@components']?.clm?.responsible_person?.username;
  const responsiblePersonTitle =
    contentData?.['@components']?.clm?.responsible_person?.title;

  if (!contentData) {
    return null;
  }

  if (!hasAuthors) {
    return null;
  }

  return (
    <section className="about-content" aria-labelledby="about-content-title">
      <h2 id="about-content-title">{intl.formatMessage(messages.title)}</h2>
      <div className="about-content-grid">
        <div className="about-content-item about-content-author">
          <h3>{intl.formatMessage(messages.author)}</h3>
          <div className="about-content-people">
            {creatorsWithData.map(({ name, portrait }) => (
              <div className="about-content-person" key={name}>
                <PersonPill
                  id={name}
                  fullname={name}
                  portrait={portrait ? expandToBackendURL(portrait) : undefined}
                />
              </div>
            ))}
          </div>
        </div>
        {responsiblePersonUrl && responsiblePersonTitle && (
          <div className="about-content-item about-content-responsible">
            <h3>{intl.formatMessage(messages.responsible)}</h3>
            <div className="about-content-person">
              <PersonPill
                id={responsiblePersonUsername}
                fullname={responsiblePersonTitle}
              />
            </div>
          </div>
        )}
        {contentData.created && (
          <AboutContentDate
            label={intl.formatMessage(messages.created)}
            date={contentData.created}
            locale={intl.locale}
            className="about-content-created"
          />
        )}
        {contentData.modified && (
          <AboutContentDate
            label={intl.formatMessage(messages.modified)}
            date={contentData.modified}
            locale={intl.locale}
            className="about-content-modified"
          />
        )}
      </div>
      <div className="about-content-feedback-area">
        <div className="about-content-feedback-header">
          <div className="about-content-feedback-heading">
            <span className="about-content-feedback-private">
              <Icon name={lockSVG} size="16px" />
              {intl.formatMessage(messages.private)}
            </span>
            <span className="about-content-feedback-title">
              {intl.formatMessage(messages.feedbackTitle)}
            </span>
          </div>
          {responsiblePersonTitle && (
            <div className="about-content-feedback-recipient">
              <span>{intl.formatMessage(messages.goesTo)}</span>
              <PersonPill
                id={responsiblePersonUsername}
                fullname={responsiblePersonTitle}
                compact
              />
            </div>
          )}
        </div>
        {!isFeedbackOpen ? (
          <div className="about-content-feedback-toggle">
            <button
              type="button"
              aria-controls="about-content-feedback-form"
              aria-expanded={false}
              onClick={() => setIsFeedbackOpen(true)}
            >
              {intl.formatMessage(messages.showFeedbackForm)}
            </button>
          </div>
        ) : (
          <div
            className="about-content-feedback"
            id="about-content-feedback-form"
          >
            <textarea
              id="about-content-feedback"
              name="about-content-feedback"
              aria-label={intl.formatMessage(messages.feedbackPlaceholder)}
              placeholder={intl.formatMessage(messages.feedbackPlaceholder)}
              rows={1}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
            />
            <button type="button" disabled={!feedback.trim()}>
              <Icon name={sendSVG} size="28px" />
              {intl.formatMessage(messages.sendFeedback)}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutThisContent;
