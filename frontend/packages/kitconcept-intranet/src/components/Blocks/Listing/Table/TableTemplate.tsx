import { useId, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import ConditionalLink from '@plone/volto/components/manage/ConditionalLink/ConditionalLink';
import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import { flattenToAppURL, isInternalURL } from '@plone/volto/helpers/Url/Url';
import { cellTypes } from './cellTypes';
import { getCellValue, getTableColumns } from './columns';

const messages = defineMessages({
  table: { id: 'Table', defaultMessage: 'Table' },
});

type TableTemplateProps = {
  items: any[];
  isEditMode?: boolean;
  linkTitle?: string;
  linkHref?: { '@id': string }[];
  headline?: string;
  // Metadata fields picked in the block settings (`tableColumnsSchemaEnhancer`)
  tableColumns?: string[];
};

const TableTemplate = ({
  items,
  isEditMode = false,
  linkTitle,
  linkHref,
  headline,
  tableColumns,
}: TableTemplateProps) => {
  const intl = useIntl();
  const captionId = useId();
  const site = useSelector((state: any) => state.site?.data);
  const showProfileLinks = site?.['kitconcept.clickable_profile_links'];

  const columns = useMemo(() => getTableColumns(tableColumns), [tableColumns]);

  let link = null;
  const href = linkHref?.[0]?.['@id'] || '';
  if (isInternalURL(href)) {
    link = (
      <ConditionalLink to={flattenToAppURL(href)} condition={!isEditMode}>
        {linkTitle || href}
      </ConditionalLink>
    );
  } else if (href) {
    link = <UniversalLink href={href}>{linkTitle || href}</UniversalLink>;
  }

  return (
    <>
      <div
        className="listing-table-wrapper"
        role="region"
        aria-labelledby={captionId}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <table className="listing-table">
          <caption id={captionId} className="visually-hidden">
            {headline || intl.formatMessage(messages.table)}
          </caption>
          <thead>
            <tr>
              {columns.map((column) => {
                const title = intl.formatMessage({
                  id: column.title,
                  defaultMessage: column.title,
                });
                return (
                  <th
                    key={column.id}
                    scope="col"
                    className={`cell-id-${column.id} cell-${column.type}`}
                  >
                    {column.hideTitle ? (
                      <span className="visually-hidden">{title}</span>
                    ) : (
                      title
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item['@id']}>
                {columns.map((column) => {
                  const value = getCellValue(item, column);
                  const Cell = column.rowHeader ? 'th' : 'td';
                  return (
                    <Cell
                      key={column.id}
                      scope={column.rowHeader ? 'row' : undefined}
                      className={`cell-id-${column.id} cell-${column.type}`}
                    >
                      {value !== null &&
                        cellTypes[column.type].render(value, {
                          item,
                          isEditMode,
                          showProfileLinks,
                        })}
                    </Cell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {link && <div className="footer">{link}</div>}
    </>
  );
};

export default TableTemplate;
