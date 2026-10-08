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
