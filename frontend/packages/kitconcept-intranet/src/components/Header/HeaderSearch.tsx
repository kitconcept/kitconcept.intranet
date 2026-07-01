import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Dialog, Modal, ModalOverlay } from 'react-aria-components';

import Icon from '@plone/volto/components/theme/Icon/Icon';
import zoomSVG from '@plone/volto/icons/zoom.svg';

const HeaderSearch = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const history = useHistory();

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = searchText.trim();

    history.push(
      text ? `/search?SearchableText=${encodeURIComponent(text)}` : '/search',
    );

    setIsSearchOpen(false);
  };

  return (
    <>
      <Button
        className="header-search-button"
        type="button"
        aria-label="Search"
        onPress={() => setIsSearchOpen(true)}
      >
        <Icon name={zoomSVG} size="24px" />
      </Button>

      <ModalOverlay
        className="header-search-modal-backdrop"
        isDismissable
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
      >
        <Modal className="header-search-modal">
          <Dialog
            className="header-search-dialog"
            role="dialog"
            aria-label="Search"
          >
            <form onSubmit={submitSearch}>
              <div className="header-search-input-row">
                <Icon name={zoomSVG} size="24px" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchText}
                  aria-label="Search"
                  placeholder="Search..."
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </div>
            </form>

            <div className="header-search-empty">Start typing to search...</div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
};

export default HeaderSearch;
