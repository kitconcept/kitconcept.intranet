import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Button, MenuTrigger } from '@plone/components';
import WorkspaceSwitcherMenu from './WorkspaceSwitcherMenu';

vi.mock('@plone/volto/helpers/Url/Url', () => ({
  flattenToAppURL: (url: string) => url,
}));

const workspaces = [
  { '@id': '/alpha', title: 'Alpha' },
  { '@id': '/beta', title: 'Beta' },
];

function renderMenu(
  props: Partial<Parameters<typeof WorkspaceSwitcherMenu>[0]>,
) {
  render(
    <IntlProvider locale="en">
      <MenuTrigger>
        <Button>Open</Button>
        <WorkspaceSwitcherMenu
          workspaces={workspaces}
          isLoading={false}
          selectedId={null}
          showPortal
          portalTitle="All workspaces"
          {...props}
        />
      </MenuTrigger>
    </IntlProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open' }));
}

describe('WorkspaceSwitcherMenu', () => {
  it('filters workspaces by search and keeps the portal row', async () => {
    renderMenu({ onSelect: vi.fn() });
    fireEvent.change(await screen.findByRole('searchbox'), {
      target: { value: 'bet' },
    });
    expect(screen.queryByRole('menuitem', { name: 'Alpha' })).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Beta' })).toBeTruthy();
    expect(
      screen.getByRole('menuitem', { name: 'All workspaces' }),
    ).toBeTruthy();
    expect(screen.getByText('Workspaces · 1 match')).toBeTruthy();
  });

  it('reports the selected workspace, and null for the portal row', async () => {
    const onSelect = vi.fn();
    renderMenu({ onSelect });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Alpha' }));
    expect(onSelect).toHaveBeenLastCalledWith('/alpha');
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'All workspaces' }),
    );
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it('shows the portal row description', async () => {
    renderMenu({
      portalTitle: 'Everywhere',
      portalDescription: 'Search in all areas',
      onSelect: vi.fn(),
    });
    await screen.findByRole('menuitem', { name: /Everywhere/ });
    expect(screen.getByText('Search in all areas')).toBeTruthy();
  });

  it('hides the portal row when showPortal is false', async () => {
    renderMenu({ showPortal: false });
    await screen.findByRole('menuitem', { name: 'Alpha' });
    expect(
      screen.queryByRole('menuitem', { name: 'All workspaces' }),
    ).toBeNull();
    expect(
      screen.getByRole('menuitem', { name: 'Alpha' }).getAttribute('href'),
    ).toBe('/alpha');
  });

  it('marks the selected workspace', async () => {
    renderMenu({ selectedId: '/beta', onSelect: vi.fn() });
    const beta = await screen.findByRole('menuitem', { name: 'Beta' });
    expect(beta.className).toContain('is-active');
    const alpha = screen.getByRole('menuitem', { name: 'Alpha' });
    expect(alpha.className).not.toContain('is-active');
    expect(
      screen.getByRole('menuitem', { name: 'All workspaces' }).className,
    ).not.toContain('is-active');
  });

  it('lets isPortalSelected override the portal checkmark', async () => {
    renderMenu({ isPortalSelected: false, onSelect: vi.fn() });
    const portal = await screen.findByRole('menuitem', {
      name: 'All workspaces',
    });
    expect(portal.className).not.toContain('is-active');
  });

  it('uses the given aria-label for the menu', async () => {
    renderMenu({ ariaLabel: 'Workspace', onSelect: vi.fn() });
    expect((await screen.findByRole('menu')).getAttribute('aria-label')).toBe(
      'Workspace',
    );
  });

  it('shows loading instead of the empty state while loading', async () => {
    renderMenu({ workspaces: [], isLoading: true, onSelect: vi.fn() });
    expect(await screen.findByText('Loading…')).toBeTruthy();
    expect(screen.queryByText('No workspace found')).toBeNull();
  });

  it('shows no-match state when the search filters everything out', async () => {
    renderMenu({ onSelect: vi.fn() });
    fireEvent.change(await screen.findByRole('searchbox'), {
      target: { value: 'zzz' },
    });
    expect(screen.getByText('No workspace found')).toBeTruthy();
  });
});
