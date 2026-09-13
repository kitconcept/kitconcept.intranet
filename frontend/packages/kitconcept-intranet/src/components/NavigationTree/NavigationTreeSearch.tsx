import { useIntl } from 'react-intl';
import { SearchIcon } from '@plone/components/Icons';
import { messages } from './messages';

interface NavigationTreeSearchProps {
  searchQuery: string;
  onChange: (query: string) => void;
  onClear: () => void;
}

export function NavigationTreeSearch({
  searchQuery,
  onChange,
  onClear,
}: NavigationTreeSearchProps) {
  const intl = useIntl();
  return (
    <div className="navigation-tree-search">
      <span className="nav-tree-search-icon" aria-hidden>
        <SearchIcon />
      </span>
      <input
        type="text"
        className="nav-tree-search-input"
        placeholder={intl.formatMessage(messages.searchPlaceholder)}
        value={searchQuery}
        onChange={(e) => onChange(e.target.value)}
        aria-label={intl.formatMessage(messages.searchAriaLabel)}
      />
      {searchQuery && (
        <button
          type="button"
          className="nav-tree-search-clear"
          onClick={onClear}
          aria-label={intl.formatMessage(messages.clearSearch)}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default NavigationTreeSearch;
