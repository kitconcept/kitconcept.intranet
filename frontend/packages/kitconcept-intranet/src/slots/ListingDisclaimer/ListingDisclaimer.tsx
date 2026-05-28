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

  const isPersonalized = (source) =>
    source?.sort_on === 'userRelevance' ||
    source?.query?.some(
      (item) =>
        item.o === 'plone.app.querystring.operation.selection.currentUser',
    );

  return isPersonalized(data?.querystring) || isPersonalized(data) ? (
    <div className="results-disclaimer-container">
      <p className="disclaimer">
        {intl.formatMessage(messages.DisclaimerText)}
      </p>
    </div>
  ) : null;
};

export default ListingBlockDisclaimer;
