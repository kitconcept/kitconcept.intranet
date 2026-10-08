/**
 * Sorting and filtering controls of wiki tables in the view
 * (react-aria-components). Rendered by the table-node-static shadow;
 * styled in theme/components/_wikiTable.scss.
 */
import * as React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Button, Input, SearchField } from 'react-aria-components';
import { ArrowDown, ArrowUp, ArrowUpDown, XIcon } from 'lucide-react';
import type { SortDirection } from './tableSort';

export const messages = defineMessages({
  sortBy: {
    id: 'Sort by {column}',
    defaultMessage: 'Sort by {column}',
  },
  filterTable: {
    id: 'Filter table',
    defaultMessage: 'Filter table',
  },
  filterPlaceholder: {
    id: 'Filter rows…',
    defaultMessage: 'Filter rows…',
  },
  clearFilter: {
    id: 'Clear filter',
    defaultMessage: 'Clear filter',
  },
  rowCount: {
    id: '{shown} of {total} rows',
    defaultMessage: '{shown} of {total} rows',
  },
});

/** Sort button in a header cell: none → ascending → descending → none. */
export function SortButton({
  column,
  direction,
  onPress,
}: {
  column: string;
  direction: SortDirection | null;
  onPress: () => void;
}) {
  const intl = useIntl();
  const Icon =
    direction === 'ascending'
      ? ArrowUp
      : direction === 'descending'
        ? ArrowDown
        : ArrowUpDown;
  return (
    <Button
      className="wiki-table-sort not-typeset"
      data-active={direction ? 'true' : undefined}
      aria-label={intl.formatMessage(messages.sortBy, { column })}
      onPress={onPress}
    >
      <Icon aria-hidden />
    </Button>
  );
}

/** Filter field above a table, with the number of matching rows. */
export function TableFilterField({
  value,
  onChange,
  shown,
  total,
}: {
  value: string;
  onChange: (value: string) => void;
  shown: number;
  total: number;
}) {
  const intl = useIntl();
  return (
    <div className="wiki-table-filter not-typeset">
      <SearchField
        aria-label={intl.formatMessage(messages.filterTable)}
        value={value}
        onChange={onChange}
      >
        <Input placeholder={intl.formatMessage(messages.filterPlaceholder)} />
        <Button aria-label={intl.formatMessage(messages.clearFilter)}>
          <XIcon aria-hidden />
        </Button>
      </SearchField>
      {value && (
        <span className="wiki-table-filter-count" aria-live="polite">
          {intl.formatMessage(messages.rowCount, { shown, total })}
        </span>
      )}
    </div>
  );
}
