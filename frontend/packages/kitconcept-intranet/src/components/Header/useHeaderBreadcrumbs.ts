import { useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

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
  className: string;
  items: HeaderBreadcrumbItem[];
};

export default function useHeaderBreadcrumbs(
  pathname: string,
): HeaderBreadcrumbsProps | null {
  const dispatch = useDispatch();
  const baseUrl = getBaseUrl(pathname);

  const items = useSelector(
    (state: HeaderBreadcrumbsState) => state.breadcrumbs.items,
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
        className: 'header-breadcrumbs',
        items: breadcrumbItems,
      }
    : null;
}
