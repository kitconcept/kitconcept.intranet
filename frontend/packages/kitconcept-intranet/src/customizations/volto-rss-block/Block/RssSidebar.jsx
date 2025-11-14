import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';
import BlockDataForm from '@plone/volto/components/manage/Form/BlockDataForm';

const messages = defineMessages({
  RssFeed: {
    id: 'RSS Feed',
    defaultMessage: 'RSS Feed',
  },
  title: {
    id: 'title',
    defaultMessage: 'Title',
  },
  feed: {
    id: 'Feed',
    defaultMessage: 'Feed',
  },
  feeds: {
    id: 'Feeds',
    defaultMessage: 'Feeds',
  },
  addFeed: {
    id: 'Add Feed',
    defaultMessage: 'Add Feed',
  },
  url: {
    id: 'URL',
    defaultMessage: 'URL',
  },
  source: {
    id: 'Source',
    defaultMessage: 'Source name',
  },
  limit: {
    id: 'RssLimit',
    defaultMessage: 'Maximum items to show',
  },
  template: {
    id: 'Variation',
    defaultMessage: 'Variation',
  },
  defaultTemplate: {
    id: 'List',
    defaultMessage: 'List',
  },
  gridTemplate: {
    id: 'Grid',
    defaultMessage: 'Grid',
  },
  summaryTemplate: {
    id: 'List with image',
    defaultMessage: 'List with image',
  },
});

const feedSchema = ({ intl }) => ({
  title: intl.formatMessage(messages.feed),
  addMessage: intl.formatMessage(messages.addFeed),
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['url', 'source'],
    },
  ],
  properties: {
    url: {
      title: intl.formatMessage(messages.url),
      type: 'string',
    },
    source: {
      title: intl.formatMessage(messages.source),
      type: 'string',
    },
  },
  required: ['url'],
});

const rssSchema = ({ intl }) => ({
  title: intl.formatMessage(messages.RssFeed),
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['title', 'template', 'feeds', 'limit'],
    },
  ],
  properties: {
    title: {
      title: intl.formatMessage(messages.title),
      type: 'string',
    },
    template: {
      title: intl.formatMessage(messages.template),
      widget: 'select',
      choices: [
        ['default', intl.formatMessage(messages.defaultTemplate)],
        ['grid', intl.formatMessage(messages.gridTemplate)],
        ['summary', intl.formatMessage(messages.summaryTemplate)],
      ],
      default: 'default',
    },
    feeds: {
      title: intl.formatMessage(messages.feeds),
      widget: 'object_list',
      schema: feedSchema,
    },
    limit: {
      title: intl.formatMessage(messages.limit),
      type: 'number',
      minimun: 1,
      default: 10,
    },
  },
  required: [],
});

const RssSidebar = ({
  data,
  block,
  onChangeBlock,
  blocksConfig,
  navRoot,
  contentType,
}) => {
  const intl = useIntl();
  const schema = rssSchema({ data, intl });
  useEffect(() => {
    if (!data.limit || !data.feeds) {
      let newData = { ...data };
      newData.limit = data.limit ?? 10;
      newData.feeds = data.feeds ?? [];
      onChangeBlock(block, {
        ...newData,
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BlockDataForm
      schema={schema}
      title={schema.title}
      onChangeField={(id, value) => {
        const processedValue =
          id === 'limit' && value ? parseInt(value, 10) : value;
        onChangeBlock(block, {
          ...data,
          [id]: processedValue,
        });
      }}
      onChangeBlock={onChangeBlock}
      formData={data}
      block={block}
      blocksConfig={blocksConfig}
      navRoot={navRoot}
      contentType={contentType}
    />
  );
};

RssSidebar.propTypes = {
  data: PropTypes.objectOf(PropTypes.any).isRequired,
  block: PropTypes.string.isRequired,
  onChangeBlock: PropTypes.func.isRequired,
  blocksConfig: PropTypes.objectOf(PropTypes.any),
  navRoot: PropTypes.string,
  contentType: PropTypes.string,
};

export default RssSidebar;
