/**
 * Wiki tables in the view: look, sorting, filtering (manual test plan of
 * https://github.com/kitconcept/kitconcept.intranet/pull/518, sections A, K,
 * L, M).
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/667
 */
import { openInEditor, openInView } from '../fixtures/pages';
import {
  clearFilterButtonOf,
  columnTexts,
  filterCountOf,
  filterFieldOf,
  hasFilterField,
  sortButton,
  viewTable,
  editorTable,
} from '../fixtures/table';
import { createTablePage, TABLES } from '../fixtures/wiki-pages';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 30_000 });

const BUDGET = TABLES['projektbudget-2026'];
const PARTICIPANTS = TABLES['teilnehmende-konsortialtreffen'];

const OPEN_ITEMS_STORED = [
  'Lieferverzug Reaktormodul klären',
  'Protokoll KW 38 freigeben',
  'Datenmanagementplan aktualisieren',
  'Termin für die Beiratssitzung finden',
  'Katalysator-Proben nach Mailand senden',
  'Einladungen zum Workshop versenden',
  'Kostenabweichung WP3 begründen',
  'Vereinbarung mit dem Industriepartner prüfen',
];

test.describe('Wiki tables: look (A)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('tables span the content width and have a grey bold header row', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(page, 'projektbudget-2026');
    await openInView(page, contentPath);

    const table = viewTable(page, BUDGET.budget);
    await expect(table).toBeVisible();
    const widths = await table.evaluate((el) => ({
      table: el.getBoundingClientRect().width,
      block: (
        el.closest('.block-inner-container') ?? el.parentElement!
      ).getBoundingClientRect().width,
    }));
    expect(widths.table).toBeGreaterThan(widths.block * 0.95);

    const header = table.locator('tr').first().locator('th');
    await expect(header).toHaveCount(6);
    const style = await header.first().evaluate((el) => {
      const cs = getComputedStyle(el);
      const text = el.querySelector('p, span') ?? el;
      return {
        background: cs.backgroundColor,
        weight: Number(getComputedStyle(text).fontWeight),
      };
    });
    expect(style.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(style.weight).toBeGreaterThanOrEqual(600);

    // Marks and links in cells survive (milestone table).
    const milestones = viewTable(page, BUDGET.milestones);
    await expect(
      milestones.getByRole('link', { name: 'Entwurf' }),
    ).toBeVisible();
    await expect(table.locator('strong').first()).toBeVisible();
  });

  test('a wide table scrolls inside the page, the page does not', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInView(page, contentPath);

    const table = viewTable(page, PARTICIPANTS.attendance);
    await expect(table.locator('tr').first().locator('th')).toHaveCount(9);
    const scroll = await table.evaluate((el) => {
      const container = el.closest('.overflow-x-auto') as HTMLElement;
      return {
        container: container.scrollWidth > container.clientWidth,
        page:
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      };
    });
    expect(scroll.container).toBe(true);
    expect(scroll.page).toBe(true);
  });
});

test.describe('Wiki tables: sorting in the view (K)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dates sort as dates, empty cells last in both directions', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInView(page, contentPath);
    const table = viewTable(page, PARTICIPANTS.openItems);
    const due = sortButton(table, 2);

    await due.click();
    await expect
      .poll(() => columnTexts(table, 2))
      .toEqual([
        '02.10.2026',
        '09.10.2026',
        '15.10.2026',
        '20.10.2026',
        '31.10.2026',
        '16.11.2026',
        '30.11.2026',
        '',
      ]);
    await expect(table.locator('th').nth(2)).toHaveAttribute(
      'aria-sort',
      'ascending',
    );

    await due.click();
    await expect
      .poll(() => columnTexts(table, 2))
      .toEqual([
        '30.11.2026',
        '16.11.2026',
        '31.10.2026',
        '20.10.2026',
        '15.10.2026',
        '09.10.2026',
        '02.10.2026',
        '',
      ]);
    await expect(table.locator('th').nth(2)).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  test('German decimals sort as numbers, empty cells last', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInView(page, contentPath);
    const table = viewTable(page, PARTICIPANTS.openItems);
    const effort = sortButton(table, 3);

    await effort.click();
    await expect
      .poll(() => columnTexts(table, 3))
      .toEqual(['0,5', '1', '2', '3,5', '6', '8', '12', '']);
    await effort.click();
    await expect
      .poll(() => columnTexts(table, 3))
      .toEqual(['12', '8', '6', '3,5', '2', '1', '0,5', '']);
  });

  test('amounts sort numerically, not as text', async ({ page }) => {
    const { contentPath } = await createTablePage(page, 'projektbudget-2026');
    await openInView(page, contentPath);
    const table = viewTable(page, BUDGET.budget);

    await sortButton(table, 2).click();
    await expect
      .poll(() => columnTexts(table, 0))
      .toEqual([
        'WP4 Dissemination',
        'WP5 Datenmanagement',
        'WP1 Koordination',
        'WP2 Katalysator-Screening',
        'WP3 Pilotanlage',
        'Gesamt',
      ]);
  });

  test('third click restores the stored order; another column starts ascending', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInView(page, contentPath);
    const table = viewTable(page, PARTICIPANTS.openItems);

    for (let i = 0; i < 3; i++) await sortButton(table, 3).click();
    await expect.poll(() => columnTexts(table, 0)).toEqual(OPEN_ITEMS_STORED);
    await expect(table.locator('th').nth(3)).not.toHaveAttribute(
      'aria-sort',
      /ascending|descending/,
    );

    await sortButton(table, 3).click();
    await sortButton(table, 2).click();
    await expect(table.locator('th').nth(2)).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    await expect
      .poll(async () => (await columnTexts(table, 2))[0])
      .toBe('02.10.2026');
  });

  test('sort buttons are keyboard accessible and named', async ({ page }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInView(page, contentPath);
    const table = viewTable(page, PARTICIPANTS.openItems);

    const button = table.getByRole('button', { name: 'Sort by Fällig' });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(table.locator('th').nth(2)).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  test('small tables sort without a filter; merged cells switch both off', async ({
    page,
  }) => {
    const budget = await createTablePage(page, 'projektbudget-2026');
    await openInView(page, budget.contentPath);
    const milestones = viewTable(page, BUDGET.milestones);
    await expect(milestones.locator('button.wiki-table-sort')).toHaveCount(4);
    expect(await hasFilterField(milestones)).toBe(false);

    const participants = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInView(page, participants.contentPath);
    const agenda = viewTable(page, PARTICIPANTS.agenda);
    await expect(agenda.locator('td[colspan="2"]')).toHaveCount(1);
    await expect(agenda.locator('button.wiki-table-sort')).toHaveCount(0);
    expect(await hasFilterField(agenda)).toBe(false);
  });
});

test.describe('Wiki tables: filtering in the view (L)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('every word must match, case does not matter, with a row count', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInView(page, contentPath);
    const table = viewTable(page, PARTICIPANTS.openItems);
    const field = filterFieldOf(table);
    const rows = () => table.locator('tr');

    const cases: [string, number][] = [
      ['offen', 4],
      ['in arbeit', 3],
      ['meier offen', 1],
      ['MEIER', 2],
    ];
    for (const [query, shown] of cases) {
      await field.fill(query);
      await expect(rows()).toHaveCount(shown + 1);
      await expect(filterCountOf(table)).toHaveText(`${shown} of 8 rows`);
    }
  });

  test('no match keeps the header row; clear button and Escape reset', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInView(page, contentPath);
    const contacts = viewTable(page, PARTICIPANTS.contacts);
    const field = filterFieldOf(contacts);

    await field.fill('tu aachen');
    await expect(contacts.locator('tr')).toHaveCount(3);
    await field.fill('xyz');
    await expect(contacts.locator('tr')).toHaveCount(1);
    await expect(contacts.locator('th').first()).toHaveText('Name');

    await clearFilterButtonOf(contacts).click();
    await expect(contacts.locator('tr')).toHaveCount(8);

    await field.fill('xyz');
    await field.press('Escape');
    await expect(field).toHaveValue('');
    await expect(contacts.locator('tr')).toHaveCount(8);
  });

  test('filter and sort work together; each table filters on its own', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInView(page, contentPath);
    const table = viewTable(page, PARTICIPANTS.openItems);
    const contacts = viewTable(page, PARTICIPANTS.contacts);

    await filterFieldOf(table).fill('offen');
    await sortButton(table, 2).click();
    await expect
      .poll(() => columnTexts(table, 2))
      .toEqual(['15.10.2026', '20.10.2026', '16.11.2026', '']);
    await expect(contacts.locator('tr')).toHaveCount(8);
  });
});

test.describe('Wiki tables: nothing is stored (M)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('reload and the editor show the stored order', async ({ page }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInView(page, contentPath);
    const table = viewTable(page, PARTICIPANTS.openItems);
    await sortButton(table, 2).click();
    await filterFieldOf(table).fill('offen');
    await expect(table.locator('tr')).toHaveCount(5);

    await page.reload({ waitUntil: 'networkidle' });
    await expect(
      filterFieldOf(viewTable(page, PARTICIPANTS.openItems)),
    ).toHaveValue('');
    await expect
      .poll(() => columnTexts(viewTable(page, PARTICIPANTS.openItems), 0))
      .toEqual(OPEN_ITEMS_STORED);

    await sortButton(viewTable(page, PARTICIPANTS.openItems), 2).click();
    await openInEditor(page, contentPath);
    await expect
      .poll(() => columnTexts(editorTable(page, PARTICIPANTS.openItems), 0))
      .toEqual(OPEN_ITEMS_STORED);
  });
});
