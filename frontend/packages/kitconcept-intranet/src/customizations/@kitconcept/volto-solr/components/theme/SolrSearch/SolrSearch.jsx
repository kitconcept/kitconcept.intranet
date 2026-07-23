/**
 * OVERRIDE: SolrSearch.jsx
 * REASON: No "Use AI" toggle (team decision 2026-07-23): when the RAG
 * feature is available, the AI answer always renders above the classic
 * results. The final presentation (an "AI" tab and "AI on top" of the
 * All tab) will come from the kitconcept.solr tabs configuration; this
 * override is the interim behavior until that lands.
 * DATE: 2026-07-23
 * DEVELOPER: @reebalazs
 *
 * Search component.
 * @module components/theme/Search/Search
 */

import React, { Component, createElement, createRef, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { asyncConnect } from '@plone/volto/helpers/AsyncConnect';
import { FormattedMessage } from 'react-intl';
import { createPortal } from 'react-dom';
import {
  Container,
  Segment,
  Pagination,
  Button,
  Dimmer,
  Loader,
  Checkbox,
} from 'semantic-ui-react';
import { injectIntl, useIntl, defineMessages } from 'react-intl';
import qs from 'query-string';

import config from '@plone/volto/registry';
import Helmet from '@plone/volto/helpers/Helmet/Helmet';
import Toolbar from '@plone/volto/components/manage/Toolbar/Toolbar';
import Icon from '@plone/volto/components/theme/Icon/Icon';

import paginationLeftSVG from '@plone/volto/icons/left-key.svg';
import paginationRightSVG from '@plone/volto/icons/right-key.svg';
// These imports and the legacySearchProps are only for the legacy search
import { searchContent } from '@plone/volto/actions/search/search';
import { DefaultResultItem } from '@kitconcept/volto-solr/components/theme/SolrSearch/resultItems';
import { SelectSorting } from '@kitconcept/volto-solr/components/theme/SolrSearch/SelectSorting';
import { SelectLayout } from '@kitconcept/volto-solr/components/theme/SolrSearch/SelectLayout';
import { SearchResultInfo } from '@kitconcept/volto-solr/components/theme/SolrSearch/SearchResultInfo';
import { SearchTabs } from '@kitconcept/volto-solr/components/theme/SolrSearch/SearchTabs';
import { SearchConditions } from '@kitconcept/volto-solr/components/theme/SolrSearch/SearchConditions';
import {
  queryStateFromParams,
  queryStateToParams,
} from '@kitconcept/volto-solr/components/theme/SolrSearch/SearchQuery';
import { VocabProvider } from '@kitconcept/volto-solr/components/theme/SolrSearch/vocabs/VocabContext';
import { ragSearch, resetRagSearch } from '@kitconcept/volto-solr/actions';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';

const messages = defineMessages({
  TypeSearchWords: {
    id: 'Search...',
    defaultMessage: 'Search...',
  },
  results: {
    // Ergebnisse
    id: 'results',
    defaultMessage: 'results',
  },
  searchLocalizedLabel: {
    // Suchergebnisse anzeigen für:
    id: 'searchLocalizedLabel',
    defaultMessage: 'Show results for:',
  },
  searchGlobalized: {
    // Alle webauftritte (global)
    id: 'searchGlobalized',
    defaultMessage: 'All content (global)',
  },
  searchLocalized: {
    // Nur dieser webauftritt
    id: 'searchLocalized',
    defaultMessage: 'This subfolder only',
  },
});

const SearchInput = forwardRef(
  ({ forwardRef, placeholder, className, value, onChange, onSubmit }, ref) => {
    const SolrSearchAutosuggest = config.widgets.SolrSearchAutosuggest;
    return (
      <SolrSearchAutosuggest
        inputRef={ref}
        placeholder={placeholder}
        className={className}
        value={value || ''}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    );
  },
);

// XXX The original input - left here for testing.
// const SearchInputDefault = forwardRef(
//   ({ forwardRef, placeholder, className, value, onChange }, ref) => {
//     return (
//       <input
//         ref={ref}
//         placeholder={placeholder}
//         className={className}
//         value={value}
//        onChange={onChange}
//       />
//     );
//   },
// );

// XXX for some reason formatMessage is missing from this.props.intl.
// Until we figure this out, just acquire it directly from hook.
// This should not be necessary.. @reebalazs
const TranslatedInput = forwardRef(
  ({ forwardRef, placeholder, className, value, onChange, onSubmit }, ref) => {
    const intl = useIntl();
    return (
      <SearchInput
        ref={ref}
        placeholder={intl.formatMessage(placeholder)}
        className={className}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    );
  },
);

// Return the path prefix, or undefined, if we are on the root.
// We consider `/` and the language specific root folders `/en`, `/de` as roots
const getPathPrefix = (location) => {
  const pathPrefix = location.pathname.replace(/\/[^/]*$/, '') + '/';
  return pathPrefix.match(/^\/([^/]+\/)?$/) ? undefined : pathPrefix;
};

// XXX for some reason formatMessage is missing from this.props.intl.
// Until we figure this out, just acquire it directly from hook.
// This should not be necessary.. @reebalazs
const LocalCheckbox = ({ onChange, checked }) => {
  const intl = useIntl();
  return (
    <div className="search-localized">
      {intl.formatMessage(messages.searchLocalizedLabel)}
      <Checkbox
        radio
        label={intl.formatMessage(messages.searchGlobalized)}
        onChange={(e, data) => onChange(!data.checked)}
        checked={!checked}
      />
      <Checkbox
        radio
        label={intl.formatMessage(messages.searchLocalized)}
        onChange={(e, data) => onChange(data.checked)}
        checked={checked}
      />
    </div>
  );
};

/**
 * SolrSearch class.
 * @class SearchComponent
 * @extends Component
 */
class SolrSearch extends Component {
  /**
   * Property types.
   * @property {Object} propTypes Property types.
   * @static
   */
  static propTypes = {
    searchContent: PropTypes.func.isRequired,
    searchAction: PropTypes.func,
    getSearchReducer: PropTypes.func,
    showSearchInput: PropTypes.bool,
    doEmptySearch: PropTypes.bool,
    contentTypeSearchResultViews: PropTypes.object,
    contentTypeSearchResultDefaultView: PropTypes.func,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        '@id': PropTypes.string,
        '@type': PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
      }),
    ),
    loaded: PropTypes.bool,
    loading: PropTypes.bool,
    total: PropTypes.number,
    batching: PropTypes.shape({
      '@id': PropTypes.string,
      first: PropTypes.string,
      last: PropTypes.string,
      prev: PropTypes.string,
      next: PropTypes.string,
    }),
    pathname: PropTypes.string.isRequired,
  };

  /**
   * Default properties.
   * @property {Object} defaultProps Default properties.
   * @static
   */
  static defaultProps = {
    items: [],
    loaded: false,
    loading: false,
    total: 0,
    batching: null,
    searchableText: null,
    path: null,
    // RAG: TESTING
    rag: {},
  };

  constructor(props) {
    super(props);
    this.state = {
      ...queryStateFromParams({}),
      currentPage: 1,
      isClient: false,
      searchwordInStatus: '',
    };
    this.inputRef = createRef();
  }

  /**
   * Component did mount
   * @method componentDidMount
   * @returns {undefined}
   */
  componentDidMount() {
    const location = this.props.history.location;
    const params = qs.parse(location.search);

    this.setState({
      ...this.queryStateFromSearchParams(),
      isClient: true,
    });
    this.doSearch(params);
    // put focus to the search input field
    if (this.props.showSearchInput) {
      this.inputRef.current.focus();
    }
  }

  /**
   * Component will receive props
   * @method componentWillReceiveProps
   * @param {Object} nextProps Next properties
   * @returns {undefined}
   */
  UNSAFE_componentWillReceiveProps = (nextProps) => {
    const search = nextProps.location.search;
    if (this.props.location.search !== search) {
      const params = qs.parse(search);
      this.setState(
        {
          ...queryStateFromParams(params),
          currentPage: 1,
        },
        () => this.doSearch(params),
      );
    }
  };

  searchParams = () => qs.parse(this.props.history.location.search);
  queryStateFromSearchParams = () => queryStateFromParams(this.searchParams());

  /**
   * Search based on the given search params
   * @method doSearch
   * @param {string} params The search params
   * @returns {undefined}
   */
  doSearch = (params) => {
    this.setState({ searchwordInStatus: params.SearchableText || '' });
    // When RAG is available (the @site endpoint reported the feature
    // enabled and configured, known before the first render), the
    // question additionally goes to the RAG endpoint: the AI answer
    // always renders above the classic result list (no toggle).
    if (this.props.ragAvailable && params.SearchableText) {
      this.props.ragSearch('', params.SearchableText);
    }
    this.props.searchContent('', {
      ...params,
      sort_on: params.sort_on !== 'relevance' ? params.sort_on : '',
      b_start: (this.state.currentPage - 1) * config.settings.defaultPageSize,
      path_prefix: getPathPrefix(window.location),
      doEmptySearch: this.props.doEmptySearch,
    });
  };

  updateSearch = () => {
    this.props.history.replace({
      search: qs.stringify(queryStateToParams(this.state)),
    });
  };

  handleQueryPaginationChange = (e, { activePage }) => {
    window.scrollTo(0, 0);
    this.setState({ currentPage: activePage }, () =>
      this.doSearch(this.searchParams()),
    );
  };

  onSortChange = (selectedOption, selectedSortOrder) => {
    this.setState(
      {
        currentPage: 1,
        sortOn: selectedOption,
        sortOrder: selectedSortOrder || 'ascending',
      },
      () => this.updateSearch(),
    );
  };

  setGroupSelect = (groupSelect) => {
    this.setState({ currentPage: 1, facetConditions: {}, groupSelect }, () =>
      this.updateSearch(),
    );
  };

  setLocal = (local) => {
    this.setState({ currentPage: 1, local }, () => this.updateSearch());
  };

  setFacetConditions = (facetConditions) => {
    this.setState({ facetConditions }, () => this.updateSearch());
  };

  setConditionTree = (f) =>
    this.setFacetConditions(f(this.state.facetConditions));

  onSubmit = (event) => {
    this.updateSearch();
    event.preventDefault();
  };

  /**
   * Render method.
   * @method render
   * @returns {string} Markup for the component.
   */
  render() {
    const { settings } = config;
    // The next line is only needed for the legacy search component.
    const resultTypeMapper = (contentType) =>
      this.props.contentTypeSearchResultViews[contentType] ||
      this.props.contentTypeSearchResultDefaultView;
    return (
      <Segment basic id="page-search" className="header-wrapper">
        <Helmet title="Search" />
        <Container>
          {this.props.showSearchInput ? (
            <div className="search-input">
              <form className="ui form" onSubmit={this.onSubmit}>
                <div className="field searchbox">
                  <TranslatedInput
                    ref={this.inputRef}
                    placeholder={messages.TypeSearchWords}
                    className="searchinput"
                    value={this.state.searchword}
                    onChange={(e) =>
                      this.setState({ searchword: e.target.value })
                    }
                    onSubmit={this.onSubmit}
                  />
                  <Button onClick={this.onSubmit}>
                    <FormattedMessage id="Search" defaultMessage="Search" />{' '}
                  </Button>
                </div>
              </form>
            </div>
          ) : null}
          {/* AI answer area: always shown above the classic results
              when the backend reports the feature available (no
              toggle - team decision 2026-07-23). An unconfigured site
              shows the classic search, untouched. Interim styling; the
              final presentation comes from the kitconcept.solr tabs
              configuration ("AI" tab / "AI on top"). */}
          {this.props.ragAvailable &&
          (this.props.rag.loading || this.props.rag.loaded) ? (
            <div className="rag-answer" style={{ margin: '1em 0' }}>
              <div
                style={{
                  border: '1px solid #ccc',
                  background: '#f8f8f8',
                  padding: '1em',
                  marginTop: '0.5em',
                }}
              >
                {this.props.rag.loading ? <p>Thinking…</p> : null}
                {this.props.rag.error ? (
                  <p style={{ color: 'red' }}>{this.props.rag.error}</p>
                ) : null}
                {this.props.rag.answer ? (
                  <p style={{ whiteSpace: 'pre-wrap' }}>
                    {this.props.rag.answer}
                  </p>
                ) : null}
                {this.props.rag.loaded &&
                !this.props.rag.answer &&
                !this.props.rag.error ? (
                  <p>No answer — no matching documents found.</p>
                ) : null}
                {(this.props.rag.sources || []).length > 0 ? (
                  <ul>
                    {this.props.rag.sources.map((source) => (
                      <li key={source.UID}>
                        <a href={flattenToAppURL(source['@id'])}>
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}
          {this.state.allowLocal &&
          getPathPrefix(this.props.history.location) !== undefined ? (
            <LocalCheckbox
              onChange={(checked) => this.setLocal(checked)}
              checked={this.state.local}
            />
          ) : null}
          <SearchResultInfo
            searchableText={this.state.searchwordInStatus}
            total={this.props.total}
          />
          <SearchTabs
            groupSelect={this.state.groupSelect}
            setGroupSelect={(groupSelect) => this.setGroupSelect(groupSelect)}
            facetGroups={this.props.facetGroups}
          />
          <VocabProvider>
            <article id="content">
              <header>
                {this.props.total > 0 ? (
                  <div className="sorting-bar">
                    <SelectLayout
                      layouts={this.props.layouts}
                      value={this.state.layout}
                      onChange={(value) => {
                        this.setState({ layout: value });
                      }}
                    />
                    <SelectSorting
                      value={this.state.sortOn}
                      onChange={(selectedOption, order) => {
                        this.onSortChange(selectedOption, order);
                      }}
                    />
                  </div>
                ) : null}
              </header>
              <div className="searchContentWrapper">
                <SearchConditions
                  groupSelect={this.state.groupSelect}
                  facetFields={this.props.facetFields}
                  vocabularies={this.props.vocabularies}
                  conditionTree={this.state.facetConditions}
                  setConditionTree={this.setConditionTree}
                />
                <Dimmer active={this.props.loading} inverted>
                  <Loader indeterminate size="small">
                    <FormattedMessage id="loading" defaultMessage="Loading" />
                  </Loader>
                </Dimmer>
                <section
                  id="content-core"
                  className={`layout-${this.state.layout}`}
                >
                  <div className="search-items">
                    {this.props.items?.map((item, index) => (
                      <div key={'' + index + '-' + item['@id']}>
                        {createElement(resultTypeMapper(item['@type']), {
                          key: item['@id'],
                          item,
                          layout: this.state.layout,
                        })}
                      </div>
                    ))}
                  </div>
                  {this.props.batching &&
                    this.props.total / settings.defaultPageSize > 1 && (
                      <div className="search-footer">
                        <Pagination
                          activePage={this.state.currentPage}
                          totalPages={Math.ceil(
                            this.props.total / settings.defaultPageSize,
                          )}
                          onPageChange={this.handleQueryPaginationChange}
                          firstItem={null}
                          lastItem={null}
                          prevItem={{
                            content: (
                              <Icon name={paginationLeftSVG} size="18px" />
                            ),
                            icon: true,
                            'aria-disabled': !this.props.batching.prev,
                            className: !this.props.batching.prev
                              ? 'disabled'
                              : null,
                          }}
                          nextItem={{
                            content: (
                              <Icon name={paginationRightSVG} size="18px" />
                            ),
                            icon: true,
                            'aria-disabled': !this.props.batching.next,
                            className: !this.props.batching.next
                              ? 'disabled'
                              : null,
                          }}
                        />
                      </div>
                    )}
                </section>
              </div>
            </article>
          </VocabProvider>
        </Container>
        {this.state.isClient &&
          createPortal(
            <Toolbar
              pathname={this.props.pathname}
              hideDefaultViewButtons
              inner={<span />}
            />,
            document.getElementById('toolbar'),
          )}
      </Segment>
    );
  }
}

// The xxxWithDefault functions are only to support the legacy search component.
const searchActionWithDefault = (searchAction) =>
  searchAction !== undefined ? searchAction : searchContent;
const getSearchReducerWithDefault = (state, { getSearchReducer }) =>
  getSearchReducer !== undefined ? getSearchReducer(state) : state.search;
const contentTypeSearchResultViewsWithDefault = (
  contentTypeSearchResultViews,
) =>
  contentTypeSearchResultViews !== undefined
    ? contentTypeSearchResultViews
    : {};
const contentTypeSearchResultDefaultViewWithDefault = (
  contentTypeSearchResultDefaultView,
) =>
  contentTypeSearchResultDefaultView !== undefined
    ? contentTypeSearchResultDefaultView
    : DefaultResultItem;

export const __test__ = connect(
  (state, props) => {
    const { items, total, loaded, loading, batching } =
      getSearchReducerWithDefault(state, props);
    return {
      items,
      total,
      loaded,
      loading,
      batching,
      intl: state.intl,
      pathname: props.history.location.pathname,
      contentTypeSearchResultViews: contentTypeSearchResultViewsWithDefault(
        props.contentTypeSearchResultViews,
      ),
      contentTypeSearchResultDefaultView:
        contentTypeSearchResultDefaultViewWithDefault(
          props.contentTypeSearchResultDefaultView,
        ),
    };
  },
  (dispatch, { searchAction }) => ({
    searchContent: (...args) =>
      dispatch(searchActionWithDefault(searchAction)(...args)),
  }),
)(SolrSearch);

export default compose(
  injectIntl,
  connect(
    (state, props) => {
      const {
        items,
        facetGroups,
        facetFields,
        layouts,
        vocabularies,
        total,
        loaded,
        loading,
        batching,
      } = getSearchReducerWithDefault(state, props);
      return {
        items,
        facetGroups,
        facetFields,
        layouts,
        vocabularies,
        total,
        loaded,
        loading,
        batching,
        // RAG: TESTING
        rag: state.ragsearch || {},
        ragAvailable:
          state?.site?.data?.['kitconcept.solr.rag_available'] === true,
        intl: state.intl,
        pathname: props.history.location.pathname,
        contentTypeSearchResultViews: contentTypeSearchResultViewsWithDefault(
          props.contentTypeSearchResultViews,
        ),
        contentTypeSearchResultDefaultView:
          contentTypeSearchResultDefaultViewWithDefault(
            props.contentTypeSearchResultDefaultView,
          ),
      };
    },
    (dispatch, { searchAction }) => ({
      searchContent: (...args) =>
        dispatch(searchActionWithDefault(searchAction)(...args)),
      // RAG: TESTING
      ragSearch: (...args) => dispatch(ragSearch(...args)),
      resetRagSearch: () => dispatch(resetRagSearch()),
    }),
  ),
  asyncConnect([
    {
      key: 'search',
      promise: ({ location, store: { dispatch }, searchAction }) =>
        dispatch(
          searchActionWithDefault(searchAction)('', {
            ...qs.parse(location.search),
            path_prefix: getPathPrefix(window.location),
            use_site_search_settings: 1,
            metadata_fields: ['effective', 'UID', 'start'],
            hl: 'true',
          }),
        ),
    },
  ]),
)(SolrSearch);
