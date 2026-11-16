import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import ConditionalLink from '@plone/volto/components/manage/ConditionalLink/ConditionalLink';
import FormattedDate from '@plone/volto/components/theme/FormattedDate/FormattedDate';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import { getContentIcon } from '@plone/volto/helpers/Content/Content';
import config from '@plone/volto/registry';
import { parseDateFromCatalog } from '@kitconcept/volto-light-theme/helpers/dates';
import { smartTextRenderer } from '@kitconcept/volto-light-theme/helpers/smartText';
import type { SummaryComponentType } from '@kitconcept/volto-light-theme/components/Summary/DefaultSummary';

export type CellContext = {
  item: any;
  isEditMode: boolean;
  // The `kitconcept.clickable_profile_links` site setting
  showProfileLinks?: boolean;
};

export type CellType = {
  // Whether a metadata value counts as missing. A column with several
  // fields shows the first one that is not empty.
  isEmpty?: (value: any) => boolean;
  render: (value: any, context: CellContext) => ReactNode;
};

export const isEmptyValue = (value: any) =>
  value === null ||
  value === undefined ||
  value === '' ||
  value === 'None' ||
  (Array.isArray(value) && value.length === 0);

// Catalog dates come back as ISO strings, unset ones as `None` or the
// 1969 floor date
export const isEmptyDate = (value: any) =>
  typeof value !== 'string' ||
  isEmptyValue(value) ||
  !parseDateFromCatalog(value);

const textCell: CellType = {
  render: (value) => String(value),
};

// How a cell renders a metadata value, by value type. The `string`, `date`,
// `array`, `boolean` and `number` types match the ones Volto uses for
// catalog metadata (`@plone/volto/constants/Indexes`).
export const cellTypes: Record<string, CellType> = {
  string: textCell,
  number: textCell,
  // Text with `[text](url)` links, like the descriptions in the summaries
  smartText: {
    render: (value) => smartTextRenderer(String(value)),
  },
  boolean: {
    isEmpty: (value) => typeof value !== 'boolean',
    render: (value) =>
      value ? (
        <FormattedMessage id="Yes" defaultMessage="Yes" />
      ) : (
        <FormattedMessage id="No" defaultMessage="No" />
      ),
  },
  array: {
    render: (value) => (Array.isArray(value) ? value.join(', ') : value),
  },
  date: {
    isEmpty: isEmptyDate,
    render: (value) => (
      // @ts-expect-error FormattedDate is not typed
      <FormattedDate
        date={value}
        format={{ year: 'numeric', month: 'long', day: 'numeric' }}
      />
    ),
  },
  // The value as a link to the item: Link items open their target, files
  // download, like in the other listing templates. When to link follows
  // VLT's `DefaultTemplate`: not for types whose Summary hides the link, and
  // Person items follow the profile links site setting.
  link: {
    render: (value, { item, isEditMode, showProfileLinks }) => {
      const Summary: SummaryComponentType | undefined = config.getComponent({
        name: 'Summary',
        dependencies: [item['@type']],
      }).component;
      let showLink = !Summary?.hideLink && !isEditMode;
      if (item['@type'] === 'Person' && showProfileLinks !== undefined) {
        showLink = showProfileLinks && !isEditMode;
      }
      return (
        <ConditionalLink item={item} condition={showLink}>
          {value}
        </ConditionalLink>
      );
    },
  },
  // The content type icon, with the translated type title from
  // plone.restapi as tooltip and accessible name. On a wrapper, because
  // Volto's Icon puts its `title` into the SVG markup without escaping it.
  contentTypeIcon: {
    render: (value, { item }) => (
      <span
        className="content-type-icon"
        role="img"
        aria-label={item.type_title || value}
        title={item.type_title || value}
      >
        <Icon
          name={getContentIcon(value, item.is_folderish)}
          size="20px"
          ariaHidden
        />
      </span>
    ),
  },
};
