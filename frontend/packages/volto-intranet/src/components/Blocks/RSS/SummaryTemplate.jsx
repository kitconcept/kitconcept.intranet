import React from 'react';
import PropTypes from 'prop-types';
import { useIntl, defineMessages } from 'react-intl';
import Card from '@kitconcept/volto-light-theme/primitives/Card/Card';
import RssSummary from '../../Summary/RssSummary';

const messages = defineMessages({
  readMore: { id: 'rss_read_more', defaultMessage: 'Read more' },
  noResults: {
    id: 'rss_no_results',
    defaultMessage: 'No results from RSS feed.',
  },
});

const RssSummaryTemplate = ({ items, data, isEditMode }) => {
  const intl = useIntl();
  return (
    <div className="summary-variation">
      {data.title && <h2 className="headline">{data.title}</h2>}

      {items?.length > 0 ? (
        <div className="items">
          {items.map((item, index) => (
            <div
              className="listing-item has--align--left rss-item"
              key={item.url || index}
            >
              <Card href={!isEditMode && item.url ? item.url : null}>
                {(item.enclosure?.url || item.image) && (
                  <Card.Image
                    src={item.enclosure?.url || item.image}
                    alt={item.title || 'RSS item image'}
                    showPlaceholderImage={true}
                  />
                )}
                <Card.Summary>
                  <RssSummary item={item} HeadingTag="h2" />
                </Card.Summary>
              </Card>
            </div>
          ))}
        </div>
      ) : data.feeds?.length > 0 && data.feeds.some((feed) => feed.url) ? (
        <div className="no-rss-feed-results">
          {intl.formatMessage(messages.noResults)}
        </div>
      ) : null}
    </div>
  );
};
RssSummaryTemplate.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  data: PropTypes.object.isRequired,
  isEditMode: PropTypes.bool,
};

export default RssSummaryTemplate;
