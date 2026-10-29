import { useIntl } from 'react-intl';
import { Button, MenuTrigger } from '@plone/components';
import { ChevrondownIcon } from '@plone/components/Icons';
import { messages } from './messages';
import type { SearchItem } from './useNavigationTree';
import WorkspaceSwitcherMenu from '../WorkspaceSwitcher/WorkspaceSwitcherMenu';

interface NavigationTreeHeaderProps {
  siteTitle: string;
  workspaces: SearchItem[];
  activeWorkspace: SearchItem | undefined;
  isWorkspacesLoading: boolean;
}

export function NavigationTreeHeader({
  siteTitle,
  workspaces,
  activeWorkspace,
  isWorkspacesLoading,
}: NavigationTreeHeaderProps) {
  const intl = useIntl();
  const activeTitle = activeWorkspace ? activeWorkspace.title : siteTitle;
  const activeInitial = activeTitle?.[0]?.toUpperCase() ?? 'S';

  return (
    <MenuTrigger>
      <Button className="navigation-tree-header">
        <div className="nav-tree-site-logo" aria-hidden>
          {activeInitial}
        </div>
        <div className="nav-tree-site-info">
          <span className="nav-tree-site-label">
            {intl.formatMessage(
              activeWorkspace ? messages.workspaceLabel : messages.portalLabel,
            )}
          </span>
          <span className="nav-tree-site-title" title={activeTitle}>
            {activeTitle}
          </span>
        </div>
        <ChevrondownIcon aria-hidden className="nav-tree-switcher-chevron" />
      </Button>
      <WorkspaceSwitcherMenu
        workspaces={workspaces}
        isLoading={isWorkspacesLoading}
        selectedId={activeWorkspace?.['@id'] ?? null}
        showPortal
        portalTitle={siteTitle}
        portalSectionLabel={intl.formatMessage(messages.portalLabel)}
      />
    </MenuTrigger>
  );
}

export default NavigationTreeHeader;
