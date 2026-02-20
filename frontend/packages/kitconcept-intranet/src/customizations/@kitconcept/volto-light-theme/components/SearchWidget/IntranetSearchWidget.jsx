/**
 * Intranet Search Widget component.
 * @module components/SearchWidget
 */

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Form, Input } from 'semantic-ui-react';
import { compose } from 'redux';
import { PropTypes } from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import Icon from '@plone/volto/components/theme/Icon/Icon';
import zoomSVG from '@plone/volto/icons/zoom.svg';

import config from '@plone/volto/registry';
import { toBase64Latin1 } from '../../../../../utils/base64';

const messages = defineMessages({
  search: {
    id: 'Search',
    defaultMessage: 'Search',
  },
  searchSite: {
    id: 'Search Site',
    defaultMessage: 'Search Site',
  },
  placeholder: {
    id: 'Search for People, E-Mail Address, Phone Number, ...',
    defaultMessage: 'Search for People, E-Mail Address, Phone Number, ...',
  },
});

// Fallback Input component in case kitconcept.solr is not installed
// (which provides the SolrSearchAutosuggest widget)
const FallbackInput = (props) => <Input {...props} />;

/**
 * IntranetSearchWidget component class.
 * @class IntranetSearchWidget
 * @extends Component
 */

class IntranetSearchWidget extends Component {
  /**
   * Property types.
   * @property {Object} propTypes Property types.
   * @static
   */
  static propTypes = {
    pathname: PropTypes.string,
  };

  /**
   * Constructor
   * @method constructor
   * @param {Object} props Component properties
   * @constructs IntranetSearchWidget
   */
  constructor(props) {
    super(props);
    this.onChangeText = this.onChangeText.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.state = {
      text: '',
    };
  }

  /**
   * On change text
   * @method onChangeText
   * @param {object} event Event object.
   * @param {string} value Text value.
   * @returns {undefined}
   */
  onChangeText(event, { value }) {
    this.setState({
      text: value,
    });
  }

  /**
   * Submit handler
   * @method onSubmit
   * @param {event} event Event object.
   * @returns {undefined}
   */
  onSubmit(event) {
    const searchURL =
      this.props.site['kitconcept.intranet.external_search_url'];
    const path =
      this.props.pathname?.length > 0
        ? `&path=${encodeURIComponent(this.props.pathname)}`
        : '';

    /* START CUSTOMIZATION */
    if (searchURL) {
      let externalUrl;
      if (searchURL.includes('ifs-state')) {
        const payload = {
          params: {
            sFacetView: 'compact',
            sRlViewMode: 'standard',
            profileId: 'c2VhcmNocHJvZmlsZS1zdGFuZGFyZA==',
            hierarchicalFacets: 'navigationTree',
            sSearchTerm: this.state.text,
          },
          filter: ['++navigationTree|[Intranet]'],
          customDateFilters: [],
          sQueryId: 'c2VhcmNocHJvZmlsZS1zdGFuZGFyZA==',
          searchSettings: {},
          searchFields: {},
          searchDomain: 'all',
        };

        // Special handling for the search if includes `ifs-state` parameter, which expects the search term in BASE64
        const base64 = encodeURIComponent(
          toBase64Latin1(JSON.stringify(payload)),
        );
        externalUrl = `${searchURL}${base64}`;
      } else {
        // If searchURL contains {searchTerm}, replace it with the encoded search text
        externalUrl =
          searchURL.replace(
            '{searchTerm}',
            encodeURIComponent(this.state.text),
          ) + path;
      }
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      /*
       * These could be imported directly:
       *
       * ```js
       * import {
       *   queryStateFromParams,
       *   queryStateToParams,
       *   qs,
       * } from '@kitconcept/volto-solr/components';
       * ```
       *
       * However, we want to avoid to require a dependency on kitconcept.volto-solr.
       * So we access these utilities via the registry.
       *
       */
      const voltoSolrUtils = config.views.voltoSolrUtils;
      if (voltoSolrUtils !== undefined) {
        const { queryStateFromParams, queryStateToParams, qs } = voltoSolrUtils;
        // Update the URL query parameters with the new search text
        // Keep the other query params, only update SearchableText.
        // This way, sorting, filters, etc. are preserved.
        const newQueryParams = queryStateToParams({
          ...queryStateFromParams(qs.parse(this.props.history.location.search)),
          searchword: this.state.text,
          // Reset pagination
          currentPage: 1,
        });
        this.props.history.push({
          pathname: '/search',
          search: qs.stringify(newQueryParams),
        });
      } else {
        // Fall back without volto-solr. Only the search text is set, all other
        // query parameters are lost.
        this.props.history.push(
          `/search?SearchableText=${encodeURIComponent(this.state.text)}${path}`,
        );
      }
    }
    // reset input value
    // this.setState({
    //   text: '',
    // });
    /* END CUSTOMIZATION */
    event.preventDefault();
  }

  /**
   * Render method.
   * @method render
   * @returns {string} Markup for the component.
   */
  render() {
    // Get the SolrSearchAutosuggest widget from the registry,
    // with a fallback in case kitconcept.solr is not installed
    const SolrSearchAutosuggest =
      (this.props.site?.['collective.solr.active'] === true &&
        config.widgets.SolrSearchAutosuggest) ||
      FallbackInput;
    const { intl } = this.props;
    const searchFieldPlaceholder =
      this.props.site['kitconcept.intranet.search_field_placeholder'];
    return (
      <Form action="/search" onSubmit={this.onSubmit}>
        <Form.Field className="searchbox">
          <SolrSearchAutosuggest
            aria-label={intl.formatMessage(messages.search)}
            onChange={this.onChangeText}
            onSubmit={this.onSubmit}
            name="SearchableText"
            value={this.state.text}
            transparent
            autoComplete="off"
            placeholder={
              searchFieldPlaceholder
                ? intl.formatMessage({
                    id: searchFieldPlaceholder,
                    defaultMessage: searchFieldPlaceholder,
                  })
                : intl.formatMessage(messages.placeholder)
            }
            title={intl.formatMessage(messages.search)}
          />
          <button aria-label={intl.formatMessage(messages.search)}>
            <Icon name={zoomSVG} size="37px" />
          </button>
        </Form.Field>
      </Form>
    );
  }
}

export default compose(
  withRouter,
  injectIntl,
  connect((state, props) => ({
    site: state.site.data,
  })),
)(IntranetSearchWidget);
