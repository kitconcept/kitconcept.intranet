/**
 * A CSV file in a workspace, for the CSV table block tests.
 */
import type { Page } from '@playwright/test';

import { createContent } from '../tests/content';

/** Seven rows: enough for the filter field (shown above five rows). */
export const CSV_FILE_TEXT = `Arbeitspaket;Budget;Verantwortlich
WP1 Koordination;120000;Beck, Clara
WP2 Synthese;250000;Miriam Vogt
WP3 Messung;80000;Sophie Lang
WP4 Auswertung;95000;Jonas Weber
WP5 Bericht;30000;Miriam Vogt
WP6 Transfer;45000;Lena Fischer
WP7 Abschluss;15000;Beck, Clara
`;

/** Creates `fileId` holding `text` in the container at `path`. */
export async function createCsvFile(
  page: Page,
  { path, fileId, text }: { path: string; fileId: string; text: string },
) {
  await createContent(page, {
    contentType: 'File',
    contentId: fileId,
    contentTitle: fileId,
    path,
    bodyModifier: (body) => ({
      ...body,
      file: {
        data: Buffer.from(text, 'utf8').toString('base64'),
        encoding: 'base64',
        filename: fileId,
        'content-type': 'text/csv',
      },
    }),
  });
  return `${path.replace(/\/+$/, '')}/${fileId}`;
}
