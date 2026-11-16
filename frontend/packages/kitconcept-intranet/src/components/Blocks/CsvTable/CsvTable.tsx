/**
 * The CSV table block: a CSV file inside the intranet shown as a read-only
 * wiki table, with the sorting and filtering of the page view. Edit and
 * view render the same thing; the editor only adds a hint while no file is
 * chosen (the file is picked in the sidebar).
 *
 * The rows are rendered with the wiki page's own read-only renderer, so the
 * table looks and behaves like a table stored in the page.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/751
 */
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { PlateController, PlateRenderer } from '@plone/plate/components/editor';
import wikiEditorRenderer from '@kitconcept/volto-plate/plate/presets/wiki-renderer';
import { PlatePluginsProvider } from '@kitconcept/volto-plate/plate/context/PlatePluginsProvider';

import { csvTableValue } from './csvRows';
import { useCsvRows } from './useCsvRows';

const messages = defineMessages({
  chooseFile: {
    id: 'Choose a CSV file in the sidebar.',
    defaultMessage: 'Choose a CSV file in the sidebar.',
  },
  loading: {
    id: 'Loading the CSV file…',
    defaultMessage: 'Loading the CSV file…',
  },
  external: {
    id: 'Only CSV files inside the intranet can be shown.',
    defaultMessage: 'Only CSV files inside the intranet can be shown.',
  },
  empty: {
    id: 'The CSV file holds no rows.',
    defaultMessage: 'The CSV file holds no rows.',
  },
  request: {
    id: 'The CSV file could not be loaded.',
    defaultMessage: 'The CSV file could not be loaded.',
  },
});

export type CsvTableData = { url?: string };

const NO_DISCUSSIONS: never[] = [];
const NO_USERS = {};

function Message({ children }: { children: React.ReactNode }) {
  return <p className="csv-table-message">{children}</p>;
}

export function CsvTable({ data }: { data: CsvTableData }) {
  const intl = useIntl();
  const state = useCsvRows(data.url);
  const value = React.useMemo(
    () => (state.status === 'ready' ? csvTableValue(state.rows) : null),
    [state],
  );

  if (state.status === 'empty') {
    return <Message>{intl.formatMessage(messages.chooseFile)}</Message>;
  }
  if (state.status === 'external') {
    return <Message>{intl.formatMessage(messages.external)}</Message>;
  }
  if (state.status === 'error') {
    return (
      <Message>
        {intl.formatMessage(messages[state.reason])}
        {state.detail ? ` (${state.detail})` : ''}
      </Message>
    );
  }
  if (state.status !== 'ready' || !value) {
    return <Message>{intl.formatMessage(messages.loading)}</Message>;
  }

  // The renderer takes its value once; a new key renders a newly read file.
  return (
    <div className="csv-table" data-csv-url={data.url}>
      <PlateController>
        <PlatePluginsProvider
          initialDiscussions={NO_DISCUSSIONS}
          initialUsers={NO_USERS}
          readOnly
        >
          <PlateRenderer
            key={state.key}
            editorConfig={wikiEditorRenderer}
            value={value}
          />
        </PlatePluginsProvider>
      </PlateController>
    </div>
  );
}
