/**
 * Icons for inserting and deleting rows and columns in the table cell
 * toolbar, after Timo's design "Icon proposal: make every action
 * self-explaining" (proposal 1d): the icon shows the row or column that gets
 * added or removed, so no arrow or ✕ carries two meanings.
 *
 * Plate's toolbar uses Lucide, which has no icons for these actions; it used
 * plain arrows for "insert before/after" next to the arrows for "move", and
 * the same ✕ for deleting a row and a column. These are
 * Tabler icons (https://tabler.io/icons, MIT License, Copyright (c) 2020-2026
 * Paweł Kuna), drawn on the same grid as Lucide: 24 × 24, stroke
 * `currentColor`, stroke width 2, round caps and joins, no fill. They render
 * like Lucide components, so the toolbar sizes them the same way. All other
 * toolbar icons stay Lucide.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/674
 */
import * as React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

function icon(name: string, paths: string[]) {
  function TableToolbarIcon(props: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  }
  TableToolbarIcon.displayName = name;
  return TableToolbarIcon;
}

// Tabler row-insert-top
export const RowInsertTopIcon = icon('RowInsertTopIcon', [
  'M4 18v-4a1 1 0 0 1 1 -1h14a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1',
  'M12 9v-4',
  'M10 7l4 0',
]);

// Tabler row-insert-bottom
export const RowInsertBottomIcon = icon('RowInsertBottomIcon', [
  'M20 6v4a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h14a1 1 0 0 1 1 1',
  'M12 15l0 4',
  'M14 17l-4 0',
]);

// Tabler row-remove
export const RowRemoveIcon = icon('RowRemoveIcon', [
  'M20 6v4a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h14a1 1 0 0 1 1 1',
  'M10 16l4 4',
  'M10 20l4 -4',
]);

// Tabler column-insert-left
export const ColumnInsertLeftIcon = icon('ColumnInsertLeftIcon', [
  'M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-14a1 1 0 0 1 1 -1',
  'M5 12l4 0',
  'M7 10l0 4',
]);

// Tabler column-insert-right
export const ColumnInsertRightIcon = icon('ColumnInsertRightIcon', [
  'M6 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-14a1 1 0 0 1 1 -1',
  'M15 12l4 0',
  'M17 10l0 4',
]);

// Tabler column-remove
export const ColumnRemoveIcon = icon('ColumnRemoveIcon', [
  'M6 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-14a1 1 0 0 1 1 -1',
  'M16 10l4 4',
  'M16 14l4 -4',
]);

/**
 * Table width icons of the cell toolbar (work item 823): the block width
 * icons of @plone/icons (MIT License, used by @plone/plate's block width
 * button). The intranet package cannot import @plone/icons (it is not one of
 * its dependencies, and shadowed files resolve imports against this
 * package), so the paths are copied here. Filled shapes, 24 × 24, in
 * `currentColor`.
 * https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/823
 */
function filledIcon(
  name: string,
  paths: { d: string; evenOdd?: boolean }[],
): React.FC<IconProps> {
  function WidthIcon(props: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        {...props}
      >
        {paths.map(({ d, evenOdd }) => (
          <path
            key={d}
            d={d}
            fillRule={evenOdd ? 'evenodd' : undefined}
            clipRule={evenOdd ? 'evenodd' : undefined}
          />
        ))}
      </svg>
    );
  }
  WidthIcon.displayName = name;
  return WidthIcon;
}

// @plone/icons WidthDefaultIcon
export const WidthDefaultIcon = filledIcon('WidthDefaultIcon', [
  { d: 'M20 3H4V5H20V3Z' },
  { d: 'M4 7V17H20V7H4ZM18 9H6V15H18V9Z', evenOdd: true },
  { d: 'M4 19H20V21H4V19Z' },
]);

// @plone/icons WidthLayoutIcon
export const WidthLayoutIcon = filledIcon('WidthLayoutIcon', [
  { d: 'M2 9L4 7V17L2 15H22L20 17V7L22 9H2ZM22 7V17H2V7H22Z' },
  { d: 'M4 21H20V19H4V21Z' },
  { d: 'M4 5H20V3H4V5Z' },
]);

// @plone/icons WidthFullIcon
export const WidthFullIcon = filledIcon('WidthFullIcon', [
  {
    d: 'M9.70726 7.70712L8.29304 6.29291L4.58594 10L8.29304 13.7071L9.70726 12.2929L8.41435 11H15.5856L14.2927 12.2929L15.707 13.7071L19.4141 9.99999L15.707 6.29288L14.2927 7.70709L15.5857 9H8.41438L9.70726 7.70712Z',
  },
  { d: 'M2 3V17H22V3H2ZM20 5H4V15H20V5Z', evenOdd: true },
  { d: 'M4 19H20V21H4V19Z' },
]);
