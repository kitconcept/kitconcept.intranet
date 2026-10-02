import { useState } from 'react';
import { Button } from 'react-aria-components';

import Icon from '@plone/volto/components/theme/Icon/Icon';
import zoomSVG from '@plone/volto/icons/zoom.svg';

import { HeaderSearchDialog } from './HeaderSearch';

/**
 * The site header's search entry point: a button that looks like the
 * search input it replaces, but opens the same overlay the compact
 * workspace header opens. Outside a workspace the
 * dialog's scope defaults to "everywhere".
 */
const SiteSearchButton = ({ label }: { label: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className="site-search-button"
        type="button"
        aria-haspopup="dialog"
        onPress={() => setIsOpen(true)}
      >
        <span className="site-search-button-label">{label}</span>
        <Icon name={zoomSVG} size="37px" />
      </Button>

      <HeaderSearchDialog isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default SiteSearchButton;
