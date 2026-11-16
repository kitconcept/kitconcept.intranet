import { useHistory, useLocation } from 'react-router-dom';
import { defineMessages, useIntl } from 'react-intl';

import Icon from '@plone/volto/components/theme/Icon/Icon';
import clearSVG from '@plone/volto/icons/clear.svg';

const messages = defineMessages({
  closeSearch: {
    id: 'Close search',
    defaultMessage: 'Close search',
  },
});

type SearchLocationState = {
  searchOrigin?: string;
};

// Shown on top of the search page: an empty bar (same size and background
// as the breadcrumbs) separating the header from the search, followed by a
// "Close search" button returning to the page the search was started from.
const SearchCloseBar = () => {
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation<SearchLocationState | undefined>();

  return (
    <div className="search-close-bar">
      <div className="search-close-bar-background" />
      <div className="search-close-bar-actions">
        <button
          type="button"
          className="close-search"
          onClick={() => history.push(location.state?.searchOrigin || '/')}
        >
          <Icon name={clearSVG} size="16px" />
          {intl.formatMessage(messages.closeSearch)}
        </button>
      </div>
    </div>
  );
};

export default SearchCloseBar;
