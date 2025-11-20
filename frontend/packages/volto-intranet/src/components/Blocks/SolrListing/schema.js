const schema = {
  title: 'Solr Listing',
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['headline', 'query', 'enablePassiveTargeting', 'pageSize'],
    },
  ],
  properties: {
    headline: {
      title: 'Headline',
      type: 'string',
    },
    query: {
      title: 'Search Query',
      description: 'Add filters to the Solr query',
      type: 'string',
      default: '',
    },
    pageSize: {
      title: 'Items per page',
      type: 'number',
      default: 10,
    },
    enablePassiveTargeting: {
      title: 'Enable Passive Targeting',
      description: 'Boost results based on logged user',
      type: 'boolean',
      default: false,
    },
  },
  required: [],
};

export default schema;
