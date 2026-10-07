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
 *         - Sorting and filtering in the view (client-side, never stored):
 *           sort buttons in the header row, a filter field above tables
 *           with more than a few rows. Off in the history diff
 *           (WikiTableViewContext) and for tables with merged cells. The
 *           server render is unsorted and unfiltered, so hydration matches.
 *         Relative imports are made absolute (shadowed files resolve
 *         relative imports against this package). Everything else is
 *         unchanged.
 * FILE: https://github.com/plone/aurora/blob/plone-plate-1.0.0-alpha.24/packages/plate/components/ui/table-node-static.tsx
 * FILE VERSION: @plone/plate 1.0.0-alpha.24
 * DATE: 2026-10-01
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655
 * DEVELOPER: @reekitconcept
 * CHANGELOG:
 *  - Rebase on @plone/plate 1.0.0-alpha.24 (no upstream changes to this
 *    file since 1.0.0-alpha.20). @sneridagh
 */

import * as React from 'react';

import type {
  TElement,
  TTableCellElement,
  TTableElement,
  TTableRowElement,
} from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { BaseTablePlugin } from '@platejs/table';
import { NodeApi } from 'platejs';
import { SlateElement } from 'platejs/static';

import { BlockInnerContainer } from '@plone/plate/components/ui/block-inner-container';
import { cn } from '@plone/plate/lib/utils';
import {
  hasMergedCells,
  isHeaderRow,
} from '@kitconcept/intranet/components/WikiTable/tableMoves';
import {
  filterRowIndices,
  sortRowIndices,
  type SortDirection,
} from '@kitconcept/intranet/components/WikiTable/tableSort';
import { WikiTableViewContext } from '@kitconcept/intranet/components/WikiTable/tableViewContext';
import {
  SortButton,
  TableFilterField,
} from '@kitconcept/intranet/components/WikiTable/TableViewControls';

// OVERRIDE: per-table cell geometry, computed once (see REASON above).
type CellIndices = { row: number; col: number };
type TableGeometry = {
  indices: Map<string, CellIndices>;
  colSizes: number[];
  rowSizes: (number | undefined)[];
  rowCount: number;
};
const TableGeometryContext = React.createContext<TableGeometry | null>(null);

// OVERRIDE: sorting state of a table, for its header cells.
type TableSort = {
  sort: { col: number; dir: SortDirection } | null;
  toggle: (col: number) => void;
  columns: string[];
};
const TableSortContext = React.createContext<TableSort | null>(null);

/** Tables with more body rows than this get a filter field. */
const FILTER_MIN_ROWS = 5;

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

  // OVERRIDE: sorting and filtering (see REASON).
  const { interactive } = React.useContext(WikiTableViewContext);
  const rows = props.element.children as TTableRowElement[];
  const header = isHeaderRow(rows[0]);
  const bodyStart = header ? 1 : 0;
  const texts = React.useMemo(
    () =>
      rows
        .slice(bodyStart)
        .map((row) =>
          (row.children as TElement[]).map((cell) => NodeApi.string(cell)),
        ),
    [rows, bodyStart],
  );
  // The rows arrive as Plate's <Children> element holding the row nodes
  // (next to what plugins render below the content); that element is
  // re-rendered with the rows in display order.
  const childList: React.ReactNode[] = Array.isArray(children)
    ? children
    : [children];
  const rowsAt = childList.findIndex((child) => {
    if (!React.isValidElement(child)) return false;
    const nodes = (child.props as { children?: unknown }).children;
    return (
      Array.isArray(nodes) &&
      nodes.length === rows.length &&
      nodes[0] === rows[0]
    );
  });
  const rowNodes =
    rowsAt >= 0 ? (childList[rowsAt] as React.ReactElement) : null;
  const canReorder =
    interactive && !!rowNodes && !hasMergedCells(props.element);
  const sortable = canReorder && header && texts.length >= 2;
  const filterable = canReorder && texts.length > FILTER_MIN_ROWS;
  const [sort, setSort] = React.useState<TableSort['sort']>(null);
  const [query, setQuery] = React.useState('');
  const order = React.useMemo(() => {
    let indices = sort
      ? sortRowIndices(texts, sort.col, sort.dir)
      : texts.map((_row, index) => index);
    if (query) {
      const keep = new Set(filterRowIndices(texts, query));
      indices = indices.filter((index) => keep.has(index));
    }
    return indices;
  }, [texts, sort, query]);
  const sortValue = React.useMemo<TableSort | null>(
    () =>
      sortable
        ? {
            sort,
            toggle: (col) =>
              setSort((current) =>
                current?.col !== col
                  ? { col, dir: 'ascending' }
                  : current.dir === 'ascending'
                    ? { col, dir: 'descending' }
                    : null,
              ),
            columns: (rows[0].children as TElement[]).map((cell) =>
              NodeApi.string(cell),
            ),
          }
        : null,
    [sortable, sort, rows],
  );
  // React.Children.map keeps the children keyed like the original list.
  // Plate's <Children> element takes the row nodes (not React nodes) as its
  // children, hence the cast.
  const displayed =
    rowNodes && (sort || query)
      ? React.Children.map(children, (child, index) =>
          index === rowsAt
            ? React.cloneElement(rowNodes, undefined, [
                ...rows.slice(0, bodyStart),
                ...order.map((row) => rows[bodyStart + row]),
              ] as unknown as React.ReactNode)
            : child,
        )
      : children;

  return (
    <TableGeometryContext.Provider value={geometry}>
      <TableSortContext.Provider value={sortValue}>
        <SlateElement {...props} className="py-5">
          <BlockInnerContainer>
            {/* OVERRIDE: filter field */}
            {filterable && (
              <TableFilterField
                value={query}
                onChange={setQuery}
                shown={order.length}
                total={texts.length}
              />
            )}
            <div
              className="overflow-x-auto overflow-y-hidden"
              style={{ paddingLeft: marginLeft }}
            >
              <div className="group/table relative w-fit">
                <table className="mr-0 ml-px table h-px table-fixed border-collapse">
                  <tbody className="min-w-full">{displayed}</tbody>
                </table>
              </div>
            </div>
          </BlockInnerContainer>
        </SlateElement>
      </TableSortContext.Provider>
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
  // OVERRIDE: sort button in the header row.
  const tableSort = React.useContext(TableSortContext);
  const sortColumn =
    tableSort && isHeader && cellIndices?.row === 0 ? cellIndices.col : null;
  const sortDirection =
    sortColumn !== null && tableSort?.sort?.col === sortColumn
      ? tableSort.sort.dir
      : null;
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
        // OVERRIDE
        sortColumn !== null && 'wiki-table-sortable',
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
        // OVERRIDE
        ...(sortColumn !== null
          ? { 'aria-sort': sortDirection ?? 'none' }
          : {}),
      }}
    >
      <div
        className="relative z-20 box-border h-full px-4 py-2"
        style={{ minHeight }}
      >
        {props.children}
      </div>
      {/* OVERRIDE */}
      {sortColumn !== null && tableSort && (
        <SortButton
          column={tableSort.columns[sortColumn] ?? ''}
          direction={sortDirection}
          onPress={() => tableSort.toggle(sortColumn)}
        />
      )}
    </SlateElement>
  );
}

export function TableCellHeaderElementStatic(
  props: SlateElementProps<TTableCellElement>,
) {
  return <TableCellElementStatic {...props} isHeader />;
}
