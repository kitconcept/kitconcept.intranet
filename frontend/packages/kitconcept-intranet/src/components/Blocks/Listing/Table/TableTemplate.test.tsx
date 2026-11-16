import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IntlProvider as BaseIntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import TableTemplate from './TableTemplate';

// A static store is enough, the template only reads from it. Rendered in
// edit mode, which has no links and so needs no router (the links are
// covered by the cell type tests).
const state = {
  userSession: { token: null },
  intl: { locale: 'en', messages: {} },
  site: { data: {} },
};
const store = {
  getState: () => state,
  subscribe: () => () => {},
  dispatch: (action: any) => action,
};

const items = [
  {
    '@id': 'http://localhost:3000/news',
    '@type': 'News Item',
    title: 'News',
    type_title: 'News Item',
    Creator: 'admin',
    Type: 'News Item',
    ModificationDate: '2026-10-12T10:42:00+00:00',
  },
];

// The installed react-intl types do not declare `children` on IntlProvider
const IntlProvider = BaseIntlProvider as any;

const renderTable = (props: Record<string, any> = {}) =>
  render(
    <Provider store={store as any}>
      <IntlProvider locale="en" messages={{}}>
        <TableTemplate items={items} isEditMode {...props} />
      </IntlProvider>
    </Provider>,
  );

describe('TableTemplate', () => {
  it('makes the scroll area a focusable region named by the caption', () => {
    renderTable({ headline: 'Latest news' });
    const region = screen.getByRole('region', { name: 'Latest news' });
    expect(region.getAttribute('tabindex')).toBe('0');
    expect(screen.getByRole('table', { name: 'Latest news' })).toBeTruthy();
  });

  it('names the table "Table" when the block has no headline', () => {
    renderTable();
    expect(screen.getByRole('region', { name: 'Table' })).toBeTruthy();
  });

  it('uses the title cells as row headers', () => {
    renderTable();
    expect(screen.getByRole('rowheader', { name: 'News' })).toBeTruthy();
  });

  it('prefixes the column ids in the class names', () => {
    renderTable();
    const { classList } = screen.getByRole('rowheader');
    expect(classList.contains('cell-id-title')).toBe(true);
    expect(classList.contains('cell-link')).toBe(true);
  });
});
