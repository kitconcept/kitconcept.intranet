/**
 * OVERRIDE table-node-static.tsx
 * REASON: - Apply the stored column width as `width` on the cells (Plate
 *           only sets min/max width, which a fixed-layout table ignores), so
 *           resized columns render the same in the view as in the editor.
 *         - Render large tables in linear time. Plate's static cell asked
 *           the editor for its size and borders, which searched the whole
 *           table for the cell's row/column and the document for the
 *           cell's path, per cell: a pasted table with ~400 cells took
 *           40 s of server rendering. The table now computes every cell's
 *           row/column once and passes it down via context; the cell
 *           derives width, height and borders from that (same rules as
 *           Plate's getTableCellSize / getTableCellBorders).
 *         Relative imports are made absolute (shadowed files resolve
 *         relative imports against this package). Everything else is
 *         unchanged.
 * FILE: https://github.com/plone/plate/blob/1.0.0-alpha.15/packages/plate/components/ui/table-node-static.tsx
 * FILE VERSION: @plone/plate 1.0.0-alpha.15
 * DATE: 2026-09-22
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655
 * DEVELOPER: @reekitconcept
 */

import * as React from 'react';

import type {
  SlateElementProps,
  TTableCellElement,
  TTableElement,
  TTableRowElement,
} from 'platejs';

import { BaseTablePlugin } from '@platejs/table';
import { SlateElement } from 'platejs';

import { BlockInnerContainer } from '@plone/plate/components/ui/block-inner-container';
import { cn } from '@plone/plate/lib/utils';

// OVERRIDE: per-table cell geometry, computed once (see REASON above).
type CellIndices = { row: number; col: number };
type TableGeometry = {
  indices: Map<string, CellIndices>;
  colSizes: number[];
  rowSizes: (number | undefined)[];
  rowCount: number;
};
const TableGeometryContext = React.createContext<TableGeometry | null>(null);

function computeTableGeometry(
  table: TTableElement,
  getColSpan: (cell: TTableCellElement) => number,
  getRowSpan: (cell: TTableCellElement) => number,
): TableGeometry {
  // Same walk as Plate's computeCellIndices, for the whole table at once.
  const indices = new Map<string, CellIndices>();
  const skip: boolean[][] = [];
  const rows = table.children as TTableRowElement[];
  rows.forEach((row, rowIndex) => {
    let col = 0;
    for (const cell of row.children as TTableCellElement[]) {
      while (skip[rowIndex]?.[col]) col++;
      indices.set(cell.id as string, { row: rowIndex, col });
      const colSpan = getColSpan(cell);
      const rowSpan = getRowSpan(cell);
      for (let r = 0; r < rowSpan; r++) {
        skip[rowIndex + r] = skip[rowIndex + r] || [];
        for (let c = 0; c < colSpan; c++) skip[rowIndex + r][col + c] = true;
      }
      col += colSpan;
    }
  });
  return {
    indices,
    colSizes: (table.colSizes as number[] | undefined) ?? [],
    rowSizes: rows.map((row) => row.size as number | undefined),
    rowCount: rows.length,
  };
}

export function TableElementStatic({
  children,
  ...props
}: SlateElementProps<TTableElement>) {
  const { disableMarginLeft } = props.editor.getOptions(BaseTablePlugin);
  const marginLeft = disableMarginLeft ? 0 : props.element.marginLeft;
  // OVERRIDE
  const { api } = props.editor.getPlugin(BaseTablePlugin);
  const geometry = React.useMemo(
    () =>
      computeTableGeometry(
        props.element,
        api.table.getColSpan,
        api.table.getRowSpan,
      ),
    [props.element, api],
  );

  return (
    <TableGeometryContext.Provider value={geometry}>
      <SlateElement {...props} className="py-5">
        <BlockInnerContainer>
          <div
            className="overflow-x-auto overflow-y-hidden"
            style={{ paddingLeft: marginLeft }}
          >
            <div className="group/table relative w-fit">
              <table className="mr-0 ml-px table h-px table-fixed border-collapse">
                <tbody className="min-w-full">{children}</tbody>
              </table>
            </div>
          </div>
        </BlockInnerContainer>
      </SlateElement>
    </TableGeometryContext.Provider>
  );
}

export function TableRowElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props} as="tr" className="h-full">
      {props.children}
    </SlateElement>
  );
}

export function TableCellElementStatic({
  isHeader,
  ...props
}: SlateElementProps<TTableCellElement> & {
  isHeader?: boolean;
}) {
  const { editor, element } = props;
  const { api } = editor.getPlugin(BaseTablePlugin);

  // OVERRIDE: O(1) per cell from the table's precomputed geometry; Plate's
  // api.table.getCellSize / getCellBorders remain the fallback outside a
  // TableElementStatic.
  const geometry = React.useContext(TableGeometryContext);
  const colSpan = api.table.getColSpan(element);
  const cellIndices = geometry?.indices.get(element.id as string);
  let width: number;
  let minHeight: number | undefined;
  let borders: ReturnType<typeof api.table.getCellBorders>;
  if (geometry && cellIndices) {
    const { row, col } = cellIndices;
    width = geometry.colSizes
      .slice(col, col + colSpan)
      .reduce((total, size) => total + (size || 0), 0);
    minHeight = geometry.rowSizes[row];
    const border = (dir: 'bottom' | 'left' | 'right' | 'top') => ({
      color: element.borders?.[dir]?.color,
      size: element.borders?.[dir]?.size ?? 1,
      style: element.borders?.[dir]?.style,
    });
    borders = {
      bottom: border('bottom'),
      left: col === 0 ? border('left') : undefined,
      right: border('right'),
      top: row === 0 ? border('top') : undefined,
    };
  } else {
    ({ minHeight, width } = api.table.getCellSize({ element }));
    borders = api.table.getCellBorders({ element });
  }

  return (
    <SlateElement
      {...props}
      as={isHeader ? 'th' : 'td'}
      className={cn(
        'h-full overflow-visible border-none bg-background p-0',
        element.background ? 'bg-(--cellBackground)' : 'bg-background',
        isHeader &&
          `
            text-left font-normal
            *:m-0
          `,
        'before:size-full',
        "before:absolute before:box-border before:content-[''] before:select-none",
        borders &&
          cn(
            borders.bottom?.size && `before:border-b before:border-b-border`,
            borders.right?.size && `before:border-r before:border-r-border`,
            borders.left?.size && `before:border-l before:border-l-border`,
            borders.top?.size && `before:border-t before:border-t-border`,
          ),
      )}
      style={
        {
          '--cellBackground': element.background,
          maxWidth: width || 240,
          minWidth: width || 120,
          // OVERRIDE: column width for the fixed table layout (see
          // theme/components/_wikiTable.scss); unresized columns share the
          // table width, resized ones keep their proportion.
          width: width || 120,
        } as React.CSSProperties
      }
      attributes={{
        ...props.attributes,
        colSpan,
        rowSpan: api.table.getRowSpan(element),
      }}
    >
      <div
        className="relative z-20 box-border h-full px-4 py-2"
        style={{ minHeight }}
      >
        {props.children}
      </div>
    </SlateElement>
  );
}

export function TableCellHeaderElementStatic(
  props: SlateElementProps<TTableCellElement>,
) {
  return <TableCellElementStatic {...props} isHeader />;
}
