import React from 'react';
import PropTypes from 'prop-types';
import FormattedDate from '@plone/volto/components/theme/FormattedDate/FormattedDate';

const RssSummary = ({
  item,
  HeadingTag = 'h3',
  a11yLabelId,
  hide_description,
}) => {
  item.head_title = item.source;
  const headline = [
    item.pubDate || item.date ? (
      // @ts-expect-error
      <FormattedDate
        key="day"
        date={item.pubDate || item.date}
        format={{
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }}
        className="day"
      />
    ) : null,
    item.head_title,
  ]
    .filter((x) => x)
    .flatMap((x) => [' | ', x])
    .slice(1);
  return (
    <>
      {headline.length ? <div className="headline">{headline}</div> : null}
      <HeadingTag className="title" id={a11yLabelId}>
        {item.title ?? 'RSS Item'}
      </HeadingTag>
      {!hide_description && (item.contentSnippet || item.description) && (
        <p className="description">{item.contentSnippet || item.description}</p>
      )}
    </>
  );
};

RssSummary.propTypes = {
  item: PropTypes.object.isRequired,
  HeadingTag: PropTypes.elementType,
  a11yLabelId: PropTypes.string,
  hide_description: PropTypes.bool,
};

export default RssSummary;
