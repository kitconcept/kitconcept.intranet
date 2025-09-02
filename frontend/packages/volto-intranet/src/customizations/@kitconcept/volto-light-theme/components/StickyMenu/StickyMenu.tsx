/**
 * OVERRIDE: StickyMenu.tsx
 * REASON: Restraining sticky menus from settings/controlpanel pages
 * DATE: 2025-09-02
 * DEVELOPER: @tishasoumya-02
 */

import { useLiveData } from '@kitconcept/volto-light-theme/helpers/useLiveData';
import IconLinkList from '@kitconcept/volto-light-theme/primitives/IconLinkList';
import type { StickyMenuSettings } from '@kitconcept/volto-intranet/types';
import type { Content } from '@plone/types';

import { useLocation } from 'react-router-dom';

const StickyMenu = ({ content }: { content: Content }) => {
  const menuData = useLiveData<StickyMenuSettings['sticky_menu']>(
    content,
    'kitconcept.sticky_menu',
    'sticky_menu',
  );

  const location = useLocation();

  const setting_page = [
    'historyview',
    'aliases',
    'sharing',
    'links-to-item',
    'controlpanel',
  ];

  //To restrain the sticky menus from showing on settings/controlpanel pages
  const isSettingsPage = setting_page.some((page) =>
    location.pathname.includes(page),
  );

  const sticky_menu_color = useLiveData<
    StickyMenuSettings['sticky_menu_color']
  >(content, 'kitconcept.sticky_menu', 'sticky_menu_color');

  const sticky_menu_foreground_color = useLiveData<
    StickyMenuSettings['sticky_menu_foreground_color']
  >(content, 'kitconcept.sticky_menu', 'sticky_menu_foreground_color');

  return !isSettingsPage ? (
    <div
      className="sticky-menu"
      role="navigation"
      aria-label="Sticky menu"
      style={
        {
          '--sticky-menu-color': sticky_menu_color,
          '--sticky-menu-foreground-color': sticky_menu_foreground_color,
        } as React.CSSProperties
      }
    >
      <IconLinkList iconLinks={menuData} />
    </div>
  ) : null;
};

export default StickyMenu;
