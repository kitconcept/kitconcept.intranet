/**
 * Loads the CSV file of a CSV table block.
 *
 * The file is fetched through the frontend's own download route
 * (`…/@@download/file`), which forwards the visitor's login to the
 * backend, so a file the visitor may see in the intranet can be shown.
 * Only files inside the intranet are loaded. The file is read again every
 * time the block is rendered (no cache), so the table always shows the
 * current file.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/751
 */
import { useEffect, useState } from 'react';
import { flattenToAppURL, isInternalURL } from '@plone/volto/helpers/Url/Url';

import { parseCsvFile } from './csvRows';

export type CsvState =
  /** No file chosen yet. */
  | { status: 'empty' }
  /** The address points outside the intranet. */
  | { status: 'external' }
  | { status: 'loading' }
  /** The file could not be loaded (HTTP status) or holds no rows. */
  | { status: 'error'; reason: 'request' | 'empty'; detail?: string }
  | { status: 'ready'; rows: string[][]; key: number };

/** The download address of a file inside the intranet, or `null`. */
export function csvDownloadUrl(url: string): string | null {
  if (!isInternalURL(url)) return null;
  const path = flattenToAppURL(url).replace(/\/+$/, '');
  return `${path}/@@download/file`;
}

export function useCsvRows(url: string | undefined): CsvState {
  const [state, setState] = useState<CsvState>({ status: 'loading' });

  useEffect(() => {
    if (!url) {
      setState({ status: 'empty' });
      return;
    }
    const downloadUrl = csvDownloadUrl(url);
    if (!downloadUrl) {
      setState({ status: 'external' });
      return;
    }
    const controller = new AbortController();
    const key = Date.now();
    setState({ status: 'loading' });
    fetch(downloadUrl, {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          setState({
            status: 'error',
            reason: 'request',
            detail: `${response.status}`,
          });
          return;
        }
        const rows = parseCsvFile(await response.text());
        setState(
          rows
            ? { status: 'ready', rows, key }
            : { status: 'error', reason: 'empty' },
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          reason: 'request',
          detail: error instanceof Error ? error.message : undefined,
        });
      });
    return () => controller.abort();
  }, [url]);

  return state;
}
