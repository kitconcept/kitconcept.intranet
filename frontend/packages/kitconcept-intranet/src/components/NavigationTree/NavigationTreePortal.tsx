import { useState, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import cx from 'classnames';
import { ColumnbeforeIcon } from '@plone/components/Icons';
import { messages } from './messages';
import { NavigationTree } from './NavigationTree';

const STORAGE_KEY = 'navigation-tree-open';

function loadOpenState(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved !== null ? saved === 'true' : true;
}

function saveOpenState(value: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, String(value));
}

function NavigationTreePortal() {
  const intl = useIntl();
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(loadOpenState);
  const panelRef = useRef<HTMLDivElement>(null);

  const siteData = useSelector((state: any) => state.site?.data);
  const siteTitle: string = siteData?.title ?? 'Site';

  useEffect(() => {
    const toolbar = document.getElementById('toolbar');
    if (!toolbar) return;

    const element = document.createElement('div');
    element.id = 'navigation-tree';
    toolbar.after(element);
    setContainer(element);

    return () => {
      element.remove();
    };
  }, []);

  function handleToggle() {
    setOpen((v) => {
      saveOpenState(!v);
      return !v;
    });
  }

  function handleClose() {
    if (panelRef.current) panelRef.current.style.width = '';
    saveOpenState(false);
    setOpen(false);
  }

  if (!container) return null;

  return createPortal(
    <div
      ref={panelRef}
      className={cx('navigation-tree-panel', { 'is-open': open })}
    >
      <NavigationTree siteTitle={siteTitle} onClose={handleClose} />
      <button
        type="button"
        className="navigation-tree-collapsed-tab"
        onClick={handleToggle}
        aria-label={intl.formatMessage(messages.openNavigation)}
        title={intl.formatMessage(messages.openNavigation)}
      >
        <ColumnbeforeIcon className="navigation-tree-collapsed-icon" />
        <span className="navigation-tree-collapsed-label">
          {intl.formatMessage(messages.navigationLabel)}
        </span>
      </button>
    </div>,
    container,
  );
}

export default NavigationTreePortal;
