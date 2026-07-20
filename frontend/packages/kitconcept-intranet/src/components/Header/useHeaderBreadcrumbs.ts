import { useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { defineMessages, useIntl } from 'react-intl';

import { getBreadcrumbs } from '@plone/volto/actions/breadcrumbs/breadcrumbs';
import { flattenToAppURL, getBaseUrl } from '@plone/volto/helpers/Url/Url';
import { hasApiExpander } from '@plone/volto/helpers/Utils/Utils';

type BreadcrumbItem = {
  title: string;
  url: string;
};

type HeaderBreadcrumbsState = {
  breadcrumbs: {
    items: BreadcrumbItem[];
    root: string | null;
  };
  site?: {
    data?: {
      title?: string;
    };
  };
};

export type HeaderBreadcrumbItem = {
  '@id': string;
  title: string;
};

type HeaderBreadcrumbsProps = {
  'aria-label': string;
  items: HeaderBreadcrumbItem[];
};

const messages = defineMessages({
  controlpanel: {
    id: 'Site Setup',
    defaultMessage: 'Site Setup',
  },
});

export default function useHeaderBreadcrumbs(
  pathname: string,
): HeaderBreadcrumbsProps | null {
  const intl = useIntl();
  const { pathname: realPath } = useLocation();
  const dispatch = useDispatch();
  const baseUrl = getBaseUrl(pathname);

  const items = useSelector(
    (state: HeaderBreadcrumbsState) =>
      realPath.startsWith('/controlpanel')
        ? [
            {
              title: intl.formatMessage(messages.controlpanel),
              url: '/controlpanel',
            },
          ]
        : state.breadcrumbs.items,
    shallowEqual,
  );
  const root = useSelector(
    (state: HeaderBreadcrumbsState) => state.breadcrumbs.root,
  );
  const siteTitle = useSelector(
    (state: HeaderBreadcrumbsState) => state.site?.data?.title,
  );

  useEffect(() => {
    if (!hasApiExpander('breadcrumbs', baseUrl)) {
      dispatch(getBreadcrumbs(baseUrl));
    }
  }, [dispatch, baseUrl]);

  const rootPath = root ? flattenToAppURL(root) : '/';
  const rootItem = siteTitle ? [{ title: siteTitle, url: rootPath }] : [];
  const breadcrumbItems = [...rootItem, ...items]
    .map((item) => ({
      '@id': flattenToAppURL(item.url),
      title: item.title,
    }))
    .filter(
      (item, index, allItems) =>
        index === 0 || item['@id'] !== allItems[index - 1]?.['@id'],
    );

  return breadcrumbItems.length
    ? {
        'aria-label': 'Breadcrumbs',
        items: breadcrumbItems,
      }
    : null;
}
