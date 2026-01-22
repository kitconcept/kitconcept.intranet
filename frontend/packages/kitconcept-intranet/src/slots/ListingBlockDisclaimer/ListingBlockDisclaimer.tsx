import { useIntl, defineMessages } from 'react-intl';
import React from 'react';

const messages = defineMessages({
  DisclaimerText: {
    id: 'Sorted by relevance based on your location and organisational unit.',
    defaultMessage:
      'Sorted by relevance based on your location and organisational unit.',
  },
});

const ListingBlockDisclaimer = (props) => {
  const intl = useIntl();
  const { data = {} } = props;

  return data?.querystring?.sort_on === 'userRelevance' ? (
    <div className="results-disclaimer-container">
      <p className="disclaimer">
        {intl.formatMessage(messages.DisclaimerText)}
      </p>
    </div>
  ) : null;
};

export default ListingBlockDisclaimer;
