import { Breadcrumb, Breadcrumbs } from '@plone/components';
import { ChevronrightIcon } from '@plone/components/Icons';

import useHeaderBreadcrumbs from './useHeaderBreadcrumbs';

type HeaderBreadcrumbsProps = {
  pathname: string;
};

const HeaderBreadcrumbs = ({ pathname }: HeaderBreadcrumbsProps) => {
  const breadcrumbsProps = useHeaderBreadcrumbs(pathname);

  if (!breadcrumbsProps) {
    return null;
  }

  return (
    <Breadcrumbs {...breadcrumbsProps}>
      {(item) => (
        <Breadcrumb
          id={item['@id']}
          href={item['@id']}
          separator={
            <ChevronrightIcon
              aria-hidden="true"
              className="header-breadcrumb-separator"
              size="sm"
            />
          }
        >
          {item.title}
        </Breadcrumb>
      )}
    </Breadcrumbs>
  );
};

export default HeaderBreadcrumbs;
