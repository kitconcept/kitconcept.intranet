import { useIntl, defineMessages } from 'react-intl';
import React from 'react';

const messages = defineMessages({
  FeedbackText: {
    id: 'This is a custom list',
    defaultMessage: 'This is a custom list',
  },
});

const ResultsDisclamer = (props) => {
  const intl = useIntl();
  const data = props.content || {};

  return data?.querystring?.sort_on === 'userRelevance' ? (
    <div className="results-disclamer-container">
      <h3 className="disclamer">{intl.formatMessage(messages.FeedbackText)}</h3>
    </div>
  ) : null;
};

export default ResultsDisclamer;
