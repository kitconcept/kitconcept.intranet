import React, { useState, useEffect, useMemo, createRef } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { Pagination, Dimmer, Loader } from 'semantic-ui-react';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import config from '@plone/volto/registry';
import Card from '@kitconcept/volto-light-theme/primitives/Card/Card';
import DefaultSummary from '@kitconcept/volto-light-theme/components/Summary/DefaultSummary';

const DEFAULT_PAGE_SIZE = 10;

const messages = defineMessages({
  PaginationNavigationFor: {
    id: 'Pagination Navigation for {headline}',
    defaultMessage: 'Pagination Navigation for {headline}',
  },
  PaginationNavigation: {
    id: 'Pagination Navigation',
    defaultMessage: 'Pagination Navigation',
  },
});

// Helper function to parse image scales
const parseImageScales = (imageScales) => {
  if (!imageScales) return null;
  if (typeof imageScales === 'string') {
    try {
      return JSON.parse(imageScales);
    } catch (e) {
      return null;
    }
  }
  return imageScales;
};

// Helper function to build facet configuration
const buildFacetConfig = (queryFilters) => {
  if (!queryFilters || !Array.isArray(queryFilters) || queryFilters.length === 0) {
    return {};
  }

  const facetConfig = {};

  queryFilters.forEach((row) => {
    const { i: index, v: values } = row;
    const valueArray = Array.isArray(values) ? values : [values];

    if (valueArray && valueArray.length > 0) {
      const valueMap = {};
      valueArray.forEach((value) => {
        valueMap[value] = true;
      });

      facetConfig[index] = {
        c: valueMap,
      };
    }
  });

  return facetConfig;
};

// Helper function to build query parameters
const buildQueryParams = (data, currentPage) => {
  const pageSize = data.pageSize || DEFAULT_PAGE_SIZE;
  const start = (currentPage - 1) * pageSize;
  // backend requires accept raw_query=true, for now location and organisational unit boosting is hardcoded
  const boosting = `(+portal_type:((['' TO *] AND -Person AND -Image)) -showinsearch:False +_val_:"if(sum(termfreq(portal_type,'News Item'),termfreq(portal_type, 'File')),recip(rord(effective),1,5e5,1e4),40)" location_reference:(97e82b07b5444728b1517de15c79fefb^1000) OR organisational_unit_reference:(1a22eddf0e7941a0962cbfaa785e4b4d^1000))`;

  // Use URLSearchParams for proper encoding
  const params = new URLSearchParams({
    q: data.enablePassiveTargeting ? boosting : '*:*',
    raw_query: 'true', // Tell backend to use query as-is without escaping
    start: start.toString(),
    rows: pageSize.toString(),
  });

  const facetConfig = buildFacetConfig(data.query?.query);

  // Encode and add to params
  if (Object.keys(facetConfig).length > 0) {
    const encoded = btoa(JSON.stringify(facetConfig));
    params.append('facet_conditions', encoded);
  }

  return params;
};

const View = (props) => {
  const { data, isEditMode, intl } = props;
  const location = useLocation();
  const history = useHistory();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState(null);

  const PreviewImageComponent = config.getComponent('PreviewImage').component;
  const listingRef = createRef();

  // Get current page from URL query params
  const searchParams = new URLSearchParams(location.search);
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Fetch data from @solr endpoint
  useEffect(() => {
    const fetchData = async () => {
      const params = buildQueryParams(data, currentPage);
      const url = `/++api++/@solr?${params.toString()}`;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          let message = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            message = errorData.message || message;
          } catch {
            // If JSON parsing fails, use the default message
          }
          throw new Error(message);
        }

        const json = await response.json();
        setResults(json.response?.docs || []);
        setTotalResults(json.response?.numFound || 0);
        setError(null);
      } catch (err) {
        console.error('Error fetching Solr results:', err);
        setError(err.message || 'Failed to fetch results');
        setResults([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [data.query, data.pageSize, data.enablePassiveTargeting, currentPage, data]);

  const transformedResults = useMemo(() => {
    return results.map((item) => ({
      ...item,
      '@id': item.path_string?.replace('/Plone', '') || '',
      description: item.Description,
      title: item.Title,
      image_scales: parseImageScales(item.image_scales),
    }));
  }, [results]);

  // Handle page change
  const handlePageChange = (e, { activePage }) => {
    !isEditMode && listingRef.current?.scrollIntoView({ behavior: 'smooth' });
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.set('page', activePage.toString());
    history.push({
      pathname: location.pathname,
      search: newSearchParams.toString(),
    });
  };

  const pageSize = data.pageSize || DEFAULT_PAGE_SIZE;
  const totalPages = Math.ceil(totalResults / pageSize);

  return (
    <div className="block listing grid">
      {data.headline && (
        <h2 id="listing-grid" className="headline">
          {data.headline}
        </h2>
      )}
      {error ? (
        <div className="listing message error" ref={listingRef}>
          <p>
            <FormattedMessage
              id="Error loading results"
              defaultMessage="Error loading results"
            />
            : {error}
          </p>
        </div>
      ) : transformedResults.length > 0 ? (
        <div ref={listingRef}>
          <Dimmer active={loading} inverted>
            <Loader indeterminate size="small">
              <FormattedMessage id="loading" defaultMessage="Loading" />
            </Loader>
          </Dimmer>
          <div className="items">
            {transformedResults.map((item, index) => (
              <div className="listing-item solr-item" key={item.url || index}>
                <Card href={!isEditMode && item['@id'] ? item['@id'] : null}>
                  <Card.Image
                    className="item-image"
                    item={item}
                    imageComponent={PreviewImageComponent}
                  />

                  <Card.Summary>
                    <DefaultSummary item={item} HeadingTag="h2" />
                  </Card.Summary>
                </Card>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <Pagination
                aria-label={
                  data.headline
                    ? intl.formatMessage(messages.PaginationNavigationFor, {
                        headline: data.headline,
                      })
                    : intl.formatMessage(messages.PaginationNavigation)
                }
                className="desktop-pagination"
                activePage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                firstItem={null}
                lastItem={null}
                prevItem={{
                  content: (
                    <FormattedMessage
                      id="Previous Page"
                      defaultMessage="Previous Page"
                    />
                  ),
                  icon: false,
                  'aria-disabled': currentPage === 1,
                  className: currentPage === 1 ? 'disabled' : null,
                }}
                nextItem={{
                  content: (
                    <FormattedMessage
                      id="Next Page"
                      defaultMessage="Next Page"
                    />
                  ),
                  icon: false,
                  'aria-disabled': currentPage === totalPages,
                  className: currentPage === totalPages ? 'disabled' : null,
                }}
              />
              <Pagination
                className="mobile-pagination"
                activePage={currentPage}
                totalPages={totalPages}
                boundaryRange={1}
                siblingRange={0}
                onPageChange={handlePageChange}
                firstItem={null}
                lastItem={null}
                prevItem={undefined}
                nextItem={undefined}
              />
              <div className="total">
                <FormattedMessage id="Result" defaultMessage="Result" />{' '}
                {(currentPage - 1) * pageSize + 1}-
                {(currentPage - 1) * pageSize + transformedResults.length}{' '}
                <FormattedMessage id="of" defaultMessage="of" /> {totalResults}
              </div>
            </div>
          )}
        </div>
      ) : isEditMode ? (
        <div className="listing message" ref={listingRef}>
          {!data.query && (
            <FormattedMessage
              id="Configure a search query in the block settings."
              defaultMessage="Configure a search query in the block settings."
            />
          )}
          <Dimmer active={loading} inverted>
            <Loader indeterminate size="small">
              <FormattedMessage id="loading" defaultMessage="Loading" />
            </Loader>
          </Dimmer>
        </div>
      ) : (
        <div className="emptyListing" ref={listingRef}>
          <Dimmer active={loading} inverted>
            <Loader indeterminate size="small">
              <FormattedMessage id="loading" defaultMessage="Loading" />
            </Loader>
          </Dimmer>
        </div>
      )}
    </div>
  );
};

export default injectIntl(View);
