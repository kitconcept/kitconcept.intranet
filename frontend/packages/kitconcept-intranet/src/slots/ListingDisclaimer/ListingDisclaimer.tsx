import { useIntl, defineMessages } from 'react-intl';
import React from 'react';

const messages = defineMessages({
  DisclaimerText: {
    id: 'The displayed content is tailored to your organizational unit and location.',
    defaultMessage:
      'The displayed content is tailored to your organizational unit and location.',
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
