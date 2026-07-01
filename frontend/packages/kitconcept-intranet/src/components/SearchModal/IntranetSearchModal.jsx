import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
} from 'react-aria-components';
import { useHistory, useLocation } from 'react-router-dom';
import { defineMessages, useIntl } from 'react-intl';
import qs from 'query-string';

import Icon from '@plone/volto/components/theme/Icon/Icon';
import Search from '@plone/volto/components/theme/Search/Search';
import clearSVG from '@plone/volto/icons/clear.svg';
import zoomSVG from '@plone/volto/icons/zoom.svg';

const messages = defineMessages({
  search: {
    id: 'Search',
    defaultMessage: 'Search',
  },
  closeSearch: {
    id: 'Close search',
    defaultMessage: 'Close search',
  },
  placeholder: {
    id: 'Search for People, E-Mail Address, Phone Number, ...',
    defaultMessage: 'Search for People, E-Mail Address, Phone Number, ...',
  },
});

const normalizeSearch = (search) =>
  search ? (search.startsWith('?') ? search : `?${search}`) : '';

const getSearchFromTarget = (target) => {
  if (typeof target === 'string') {
    return normalizeSearch(
      target.split('?')[1] ? `?${target.split('?')[1]}` : '',
    );
  }
  return normalizeSearch(target?.search);
};

const IntranetSearchModal = () => {
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const inputRef = useRef(null);
  const pathnameRef = useRef(location.pathname);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [modalSearch, setModalSearch] = useState('?use_site_search_settings=1');

  const openModal = () => {
    const initialSearch =
      location.pathname === '/search'
        ? normalizeSearch(location.search) || '?use_site_search_settings=1'
        : '?use_site_search_settings=1';
    const searchParams = qs.parse(initialSearch);

    setQuery(searchParams.SearchableText || '');
    setModalSearch(initialSearch);
    setOpen(true);
  };

  const updateModalSearch = (search) => {
    const nextSearch = normalizeSearch(search) || '?use_site_search_settings=1';
    setModalSearch(nextSearch);
    setQuery(qs.parse(nextSearch).SearchableText || '');
  };

  const modalLocation = useMemo(
    () => ({
      ...location,
      pathname: '/search',
      search: modalSearch,
    }),
    [location, modalSearch],
  );

  const modalHistory = useMemo(
    () => ({
      ...history,
      location: modalLocation,
      push: (target) => {
        updateModalSearch(getSearchFromTarget(target));
      },
      replace: (target) => {
        updateModalSearch(getSearchFromTarget(target));
      },
    }),
    [history, modalLocation],
  );

  const onSubmit = (event) => {
    event.preventDefault();
    const nextParams = {
      ...qs.parse(modalSearch),
      SearchableText: query,
      use_site_search_settings: 1,
    };

    if (!query) {
      delete nextParams.SearchableText;
    }

    setModalSearch(`?${qs.stringify(nextParams)}`);
  };

  useEffect(() => {
    if (!open) return undefined;

    const timeout = window.setTimeout(() => {
      const nextParams = {
        ...qs.parse(modalSearch),
        SearchableText: query,
        use_site_search_settings: 1,
      };

      delete nextParams.b_start;

      if (!query) {
        delete nextParams.SearchableText;
      }

      const nextSearch = `?${qs.stringify(nextParams)}`;

      if (nextSearch !== modalSearch) {
        setModalSearch(nextSearch);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [modalSearch, open, query]);

  useEffect(() => {
    if (!open) return undefined;

    window.setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    if (open && pathnameRef.current !== location.pathname) {
      setOpen(false);
    }

    pathnameRef.current = location.pathname;
  }, [location.pathname, open]);

  return (
    <DialogTrigger isOpen={open} onOpenChange={setOpen}>
      <Button
        className="intranet-search-trigger"
        aria-label={intl.formatMessage(messages.search)}
        onPress={openModal}
      >
        <Icon name={zoomSVG} size="37px" />
      </Button>
      <ModalOverlay className="intranet-search-modal-layer" isDismissable>
        <Modal className="intranet-search-modal">
          <Dialog aria-label={intl.formatMessage(messages.search)}>
            {({ close }) => (
              <>
                <div className="intranet-search-modal-header">
                  <form
                    className="intranet-search-modal-form"
                    onSubmit={onSubmit}
                  >
                    <input
                      ref={inputRef}
                      aria-label={intl.formatMessage(messages.search)}
                      name="SearchableText"
                      value={query}
                      autoComplete="off"
                      placeholder={intl.formatMessage(messages.placeholder)}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                    <Button
                      type="submit"
                      aria-label={intl.formatMessage(messages.search)}
                    >
                      <Icon name={zoomSVG} size="28px" />
                    </Button>
                  </form>
                  <Button
                    className="intranet-search-modal-close"
                    aria-label={intl.formatMessage(messages.closeSearch)}
                    onPress={close}
                  >
                    <Icon name={clearSVG} size="22px" />
                  </Button>
                </div>
                <div className="intranet-search-modal-content">
                  <Search
                    key={modalSearch}
                    history={modalHistory}
                    location={modalLocation}
                    pathname="/search"
                  />
                </div>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
};

export default IntranetSearchModal;
