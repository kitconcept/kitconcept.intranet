/**
 * OVERRIDE table-node.tsx
 * REASON: Confluence-style table editing:
 *         - "Header row" toggle in the table cell toolbar (turns the first
 *           row into `th` cells and back) and move buttons for the row and
 *           the column;
 *         - row and column drag and drop with react-aria instead of
 *           @platejs/dnd (react-dnd), see
 *           components/WikiTable/useTableDragAndDrop.ts;
 *         - the row drag handle gets a 24px gutter cell instead of 8px so it
 *           no longer overlaps the first cell of a full-width table; the
 *           gutter cell is a column of width 0, its grip sits left of it in
 *           the scroll container's left padding, so the fixed layout cannot
 *           stretch it and the table starts at the text column (work item
 *           824);
 *         - only the table holding the selection shows its cell toolbar;
 *         - inserted rows are always body rows (Plate copies the header
 *           type of the row above when inserting before it);
 *         - the stored column width is applied as `width` on the cells
 *           (Plate only sets min/max width, which the fixed table layout
 *           ignores), so column resizing is visible and persists;
 *         - toolbar after Timo's design, proposal 1d (#674): insert and
 *           delete icons that show the row or column added or removed
 *           (Tabler icons in Lucide style, see
 *           components/WikiTable/tableToolbarIcons.tsx; Plate used plain
 *           arrows for insert next to the move arrows, and ✕ for delete);
 *           delete actions red and at the end of their group.
 *         The shadow's own classes are styled in
 *         theme/components/_wikiTable.scss (Tailwind classes that occur only
 *         in intranet files are not generated). The Tailwind version of each
 *         is kept in a comment next to it, for a move upstream.
 *         Relative imports are made absolute (shadowed files resolve
 *         relative imports against this package). Changes are marked with
 *         OVERRIDE comments; everything else is unchanged.
 * FILE: https://github.com/plone/aurora/blob/plone-plate-1.0.0-alpha.26/packages/plate/components/ui/table-node.tsx
 * FILE VERSION: @plone/plate 1.0.0-alpha.26
 * DATE: 2026-10-01
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655
 *         https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/674 (toolbar)
 * DEVELOPER: @reekitconcept
 * CHANGELOG:
 *  - Rebase on @plone/plate 1.0.0-alpha.26: the table is styled by
 *    `@plone/plate/styles/content.css` (`block-table__*` classes) instead of
 *    Tailwind utilities, and cell borders are `data-border-*` attributes
 *    (`cellBorderAttributes`, from the table-node-static shadow). The old
 *    Tailwind border classes were no longer generated, so set borders didn't
 *    show (work item 832). The scroll container keeps `overflow-x-auto` as a
 *    hook for theme/components/_wikiTable.scss and the acceptance tests.
 *    @sneridagh
 *  - Rebase on @plone/plate 1.0.0-alpha.24 (no upstream changes to this
 *    file since 1.0.0-alpha.20). @sneridagh
 *  - "Footer row" toggle (adds a footer row, `footer: true`) and a
 *    "Calculation" menu for its cells (`calc`: sum, average, min, max,
 *    count, see components/WikiTable/tableCalc.ts); the footer row has no
 *    drag handle and stays last (work item 750). @reekitconcept
 *  - Calculated footer cells are marked in the editor (grey: computed, not
 *    editable by hand; light red: no result, the column holds nothing the
 *    calculation can use). Editor only, the view shows nothing of it.
 *    @reekitconcept
 *  - "Width" group in the cell toolbar: Text width, Wide, Full width
 *    (the table's `blockWidth`: `default`, `layout`, `full`).
 *    https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/823
 *    @reekitconcept
 *  - Fourth width step "Medium" (`medium`, a table-only value) between
 *    Text width and Wide; the width group became one dropdown (the trigger
 *    shows the current step, the menu the four steps with their names).
 *    The cell toolbar keeps clear of the navigation tree and the sidebar,
 *    which lie over the page: Radix gets their widths as collision padding
 *    and the toolbar wraps into a second row when the space between them
 *    is too narrow.
 *    https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/825
 *    @reekitconcept
 *  - Resize handle on the right edge of a top-level table ("Resize
 *    table"), the only handle on that edge (the last column has no column
 *    resize handle there): dragging previews the width, snaps to the four
 *    steps and stores either the step it ends on or a custom width in px
 *    (`tableWidth`, see components/WikiTable/wikiTableCustomWidth.ts);
 *    stored column widths that no longer fit are scaled down. While a
 *    custom width is set, the width menu has no step checked and its
 *    trigger shows the width ("Width: 1180px"); choosing a step removes
 *    it. The column resize handles show no hover line any more (Plate's
 *    `columnResizeVariants`), the cursor is their only affordance, as for
 *    the table's handle. The left-edge indent handle is disabled
 *    (Confluence has no table indent; the stored `marginLeft` is ignored,
 *    `disableMarginLeft` in the editor kit and the renderer). Dragging a
 *    column border first stores every column's rendered width when the
 *    stored widths do not render as they are, so the border follows the
 *    pointer instead of jumping. An inserted column takes the width of its
 *    neighbour and the stored column widths are fitted to the frame.
 *    https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/824
 *    @reekitconcept
 *  - A table wider than the text column starts at the text column's left
 *    edge and grows to the right (the Notion / Claude Docs model of the
 *    research ticket #826; it was centred), so the resize handle moves only
 *    the right edge and the width follows the pointer one to one; the
 *    room is measured from the text column
 *    (theme/components/_wikiTable.scss).
 *    https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/826
 *    @reekitconcept
 */

import * as React from 'react';

import type * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

import {
  BlockSelectionPlugin,
  useBlockSelected,
} from '@platejs/selection/react';
import {
  getCellIndices,
  getTableColumnCount,
  getTableEntries,
  setCellBackground,
} from '@platejs/table';
import {
  TablePlugin,
  TableProvider,
  useTableBordersDropdownMenuContentState,
  useTableCellElement,
  useTableCellElementResizable,
  useTableElement,
  useTableMergeState,
} from '@platejs/table/react';
import { PopoverAnchor } from '@radix-ui/react-popover';
import {
  CombineIcon,
  EraserIcon,
  Grid2X2Icon,
  GripHorizontal,
  GripVertical,
  MoveDown,
  MoveHorizontalIcon,
  MoveLeft,
  MoveRight,
  MoveUp,
  PaintBucketIcon,
  PanelBottomIcon,
  PanelTopIcon,
  SigmaIcon,
  SquareSplitHorizontalIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  KEYS,
  NodeApi,
  type TElement,
  type TTableCellElement,
  type TTableElement,
  type TTableRowElement,
  type SlateEditor,
} from 'platejs';
import {
  type PlateElementProps,
  PlateElement,
  useComposedRef,
  useEditorPlugin,
  useEditorRef,
  useEditorSelector,
  useElement,
  useFocusedLast,
  usePluginOption,
  useReadOnly,
  useRemoveNodeButton,
  useSelected,
  withHOC,
} from 'platejs/react';
import { useElementSelector } from 'platejs/react';
// OVERRIDE (823): table width
import {
  BLOCK_WIDTH_KEY,
  BlockWidthPlugin,
} from '@plone/plate/components/editor/plugins/block-width-plugin';
import { defineMessages, useIntl } from 'react-intl';
import {
  messages as dndMessages,
  useColumnDragAndDrop,
  useRowDragAndDrop,
} from '@kitconcept/intranet/components/WikiTable/useTableDragAndDrop';
import {
  hasMergedCells,
  isHeaderRow,
  moveColumn,
  moveRow,
} from '@kitconcept/intranet/components/WikiTable/tableMoves';
import {
  CALC_KEY,
  CALC_KINDS,
  calcOf,
  FOOTER_KEY,
  isFooterRow,
  type CalcKind,
} from '@kitconcept/intranet/components/WikiTable/tableCalc';
import {
  ColumnInsertLeftIcon,
  ColumnInsertRightIcon,
  ColumnRemoveIcon,
  RowInsertBottomIcon,
  RowInsertTopIcon,
  RowRemoveIcon,
  // OVERRIDE (823): @plone/icons' width icons (not resolvable from here)
  WidthDefaultIcon,
  WidthFullIcon,
  WidthLayoutIcon,
  WidthMediumIcon,
} from '@kitconcept/intranet/components/WikiTable/tableToolbarIcons';
// OVERRIDE (824): custom table width
import {
  CUSTOM_WIDTH_CLASS,
  customWidthOf,
  dragChange,
  formatPx,
  dragWidth,
  fitColSizes,
  frameWidthOf,
  insertedColSizes,
  seedColSizes,
  stepWidth,
  TABLE_WIDTH_KEY,
  TABLE_WIDTH_VAR,
  type DragWidth,
  type StepWidths,
} from '@kitconcept/intranet/components/WikiTable/wikiTableCustomWidth';

import { Button } from '@plone/plate/components/ui/button';
import { BlockInnerContainer } from '@plone/plate/components/ui/block-inner-container';
import { cellBorderAttributes } from '@plone/plate/components/ui/table-node-static';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@plone/plate/components/ui/dropdown-menu';
import { Popover, PopoverContent } from '@plone/plate/components/ui/popover';
import { cn } from '@plone/plate/lib/utils';

import { blockSelectionVariants } from '@plone/plate/components/ui/block-selection';
import {
  ColorDropdownMenuItems,
  DEFAULT_COLORS,
} from '@plone/plate/components/ui/font-color-toolbar-button';
import { ResizeHandle } from '@plone/plate/components/ui/resize-handle';
import {
  BorderAllIcon,
  BorderBottomIcon,
  BorderLeftIcon,
  BorderNoneIcon,
  BorderRightIcon,
  BorderTopIcon,
} from '@plone/plate/components/ui/table-icons';
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarMenuGroup,
} from '@plone/plate/components/ui/toolbar';
// OVERRIDE: messages are duplicated in @kitconcept/intranet's src/index.ts so
// the i18n extraction picks them up (shadowed files are not scanned).
const messages = defineMessages({
  headerRow: {
    id: 'Header row',
    defaultMessage: 'Header row',
  },
  footerRow: {
    id: 'Footer row',
    defaultMessage: 'Footer row',
  },
  calculation: {
    id: 'Calculation',
    defaultMessage: 'Calculation',
  },
  none: {
    id: 'None',
    defaultMessage: 'None',
  },
  sum: {
    id: 'Sum',
    defaultMessage: 'Sum',
  },
  average: {
    id: 'Average',
    defaultMessage: 'Average',
  },
  min: {
    id: 'Minimum',
    defaultMessage: 'Minimum',
  },
  max: {
    id: 'Maximum',
    defaultMessage: 'Maximum',
  },
  count: {
    id: 'Count',
    defaultMessage: 'Count',
  },
  moveRowUp: {
    id: 'Move row up',
    defaultMessage: 'Move row up',
  },
  moveRowDown: {
    id: 'Move row down',
    defaultMessage: 'Move row down',
  },
  moveColumnLeft: {
    id: 'Move column left',
    defaultMessage: 'Move column left',
  },
  moveColumnRight: {
    id: 'Move column right',
    defaultMessage: 'Move column right',
  },
  // OVERRIDE (823): table width
  width: {
    id: 'Width',
    defaultMessage: 'Width',
  },
  widthDefault: {
    id: 'Text width',
    defaultMessage: 'Text width',
  },
  widthMedium: {
    id: 'Medium',
    defaultMessage: 'Medium',
  },
  widthLayout: {
    id: 'Wide',
    defaultMessage: 'Wide',
  },
  widthFull: {
    id: 'Full width',
    defaultMessage: 'Full width',
  },
  widthNested: {
    id: 'The table takes the width of the surrounding block',
    defaultMessage: 'The table takes the width of the surrounding block',
  },
  // OVERRIDE (824)
  resizeTable: {
    id: 'Resize table',
    defaultMessage: 'Resize table',
  },
});

// OVERRIDE (823, 825): the table widths of the cell toolbar, the values
// allowed for tables in config/blocks.ts (`medium` is a table-only step, the
// others are the theme's block widths).
const TABLE_WIDTHS = [
  { value: 'default', icon: WidthDefaultIcon, message: messages.widthDefault },
  { value: 'medium', icon: WidthMediumIcon, message: messages.widthMedium },
  { value: 'layout', icon: WidthLayoutIcon, message: messages.widthLayout },
  { value: 'full', icon: WidthFullIcon, message: messages.widthFull },
] as const;

type BlockWidthTransforms = {
  blockWidth: { setWidth: (value: string, options?: object) => void };
};

// OVERRIDE (823, 824): the table's width step. `mode: 'highest'` makes the
// block width plugin's `setNodes` match the table, not the paragraphs in
// its cells.
const setTableStep = (editor: SlateEditor, path: number[], value: string) => {
  (
    editor.getTransforms(BlockWidthPlugin) as unknown as BlockWidthTransforms
  ).blockWidth.setWidth(value, { at: path, mode: 'highest' });
};

// OVERRIDE (824): a step for a table that may have a custom width: the
// custom width goes, the step is set. Part of the caller's change (call it
// inside `withoutNormalizing`, one undo step).
const setTableStepWithoutCustomWidth = (
  editor: SlateEditor,
  table: TTableElement,
  path: number[],
  value: string,
) => {
  if (TABLE_WIDTH_KEY in table) {
    editor.tf.unsetNodes(TABLE_WIDTH_KEY, { at: path });
  }
  setTableStep(editor, path, value);
};

// OVERRIDE (824): stores the width a drag of the resize handle ended on, as
// one change (one undo step): the step it snapped to (and no custom width)
// or the custom width; column widths that no longer fit are scaled down
// (see `dragChange`). A drag that changes nothing writes nothing, nor
// does one that ends at the room when the frame was clamped to it.
const storeDraggedWidth = (
  editor: SlateEditor,
  table: TTableElement,
  next: DragWidth,
  start: { width: number; steps: StepWidths },
) => {
  const change = dragChange(table, next, {
    startWidth: start.width,
    room: start.steps.room,
    text: start.steps.text,
  });
  const path = editor.api.findPath(table);
  if (!change || !path) return;
  editor.tf.withoutNormalizing(() => {
    if (change.colSizes) {
      editor.tf.setNodes({ colSizes: change.colSizes }, { at: path });
    }
    if (change.step) {
      setTableStepWithoutCustomWidth(editor, table, path, change.step);
    } else if (change.tableWidth) {
      editor.tf.setNodes(
        { [TABLE_WIDTH_KEY]: change.tableWidth },
        { at: path },
      );
    }
  });
};

// OVERRIDE (824): whether the table shows its resize handle (its cells then
// leave the right edge to it, see TableCellElement).
const TableWidthHandleContext = React.createContext(false);

// OVERRIDE (824): the width shown while dragging; `unchanged`: releasing
// here changes nothing, the label shows the table's width as it is.
type TablePreview = DragWidth & { unchanged: boolean };

// OVERRIDE (824): the text width and the content width of a table's block.
const measureBlock = (block: HTMLElement) => {
  const style = window.getComputedStyle(block);
  const content =
    block.clientWidth -
    (Number.parseFloat(style.paddingLeft) || 0) -
    (Number.parseFloat(style.paddingRight) || 0);
  return {
    style,
    text: Number.parseFloat(
      style.getPropertyValue('--default-container-width'),
    ),
    content,
  };
};

// OVERRIDE (824): the step widths of the table's block in px, as the CSS of
// theme/components/_wikiTable.scss resolves them: `--wiki-table-room`
// reaches from the text column's left edge to the content area's right
// edge minus the side margin, never less than the text column.
const measureStepWidths = (block: HTMLElement): StepWidths => {
  const { style, text, content } = measureBlock(block);
  const px = (name: string) => Number.parseFloat(style.getPropertyValue(name));
  const margin = px('--wiki-table-side-margin') || 0;
  // The table starts at the text column's left edge (#826).
  const start = Math.max(0, (content - text) / 2);
  return {
    text,
    medium: px('--wiki-table-medium-width'),
    wide: px('--layout-container-width'),
    room: Math.max(text, content - start - margin),
  };
};

export const TableElement = withHOC(
  TableProvider,
  function TableElement({
    children,
    ...props
  }: PlateElementProps<TTableElement>) {
    const readOnly = useReadOnly();
    const isSelectionAreaVisible = usePluginOption(
      BlockSelectionPlugin,
      'isSelectionAreaVisible',
    );
    const hasControls = !readOnly && !isSelectionAreaVisible;
    const isSelectingCell = usePluginOption(TablePlugin, 'isSelectingCell');
    const { marginLeft, props: tableProps } = useTableElement();

    const isSelectingTable = useBlockSelected(props.element.id as string);

    // OVERRIDE (824): resize handle for the table width, on top-level
    // tables only (a table in a column fills the column). While dragging,
    // the width is previewed on the block (inline `--wiki-table-width` and
    // the custom width class, the same CSS as a stored width); the node is
    // written once, when the drag ends.
    const blockRef = React.useRef<HTMLDivElement>(null);
    const [preview, setPreview] = React.useState<TablePreview | null>(null);
    // No handle where the content area is narrower than the text column
    // (a small window, or the editor's sidebar and navigation tree taking
    // the room): every step and custom width is the content area there,
    // nothing can be resized.
    const topLevel = hasControls && props.path.length === 1;
    const [narrow, setNarrow] = React.useState(false);
    React.useEffect(() => {
      const block = blockRef.current;
      if (!topLevel || !block) return;
      const update = () => {
        const { text, content } = measureBlock(block);
        setNarrow(content < text - 0.5);
      };
      update();
      const observer = new ResizeObserver(update);
      observer.observe(block);
      return () => observer.disconnect();
    }, [topLevel]);
    const resizable = topLevel && !narrow;

    const content = (
      <PlateElement
        {...props}
        // OVERRIDE (824)
        ref={useComposedRef(props.ref, blockRef)}
        className={cn(preview && CUSTOM_WIDTH_CLASS)}
        style={
          preview
            ? ({
                [TABLE_WIDTH_VAR]: `${preview.width}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <BlockInnerContainer
          // OVERRIDE (824): positions the resize handle
          className={resizable ? 'wiki-table-resizable' : undefined}
        >
          <div
            className={cn(
              // OVERRIDE: `overflow-x-auto` kept as a hook (see CHANGELOG)
              'block-table__scroll overflow-x-auto',
              hasControls &&
                // OVERRIDE: 24px gutter for the row drag handle (was 8px),
                // styled in theme/components/_wikiTable.scss.
                // Tailwind version, kept for a move upstream (volto-plate's
                // Tailwind build scans only its own sources, so these classes
                // are not generated for intranet files; same for the other
                // "Tailwind version" comments in this file). pt-3: 12px on
                // top for the column drag handles (the container clips
                // vertical overflow). OVERRIDE (824): the gutter is the
                // container's left padding (1.5rem, inline below; Plate's
                // table indent `marginLeft` is disabled for wiki tables),
                // the table starts at the text column.
                // `
                //   -ml-6 pt-3
                //   *:data-[slot=block-selection]:left-6
                // `,
                'wiki-table-controls',
            )}
            style={{ paddingLeft: hasControls ? '1.5rem' : marginLeft }}
          >
            <div className="block-table__wrapper">
              <table
                className={cn(
                  'block-table__table',
                  isSelectingCell && 'selection:bg-transparent',
                )}
                {...tableProps}
              >
                <tbody>{children}</tbody>
              </table>

              {isSelectingTable && (
                <div
                  className={blockSelectionVariants()}
                  contentEditable={false}
                />
              )}
            </div>
          </div>
          {/* OVERRIDE (824) */}
          {resizable && (
            <TableWidthHandle
              blockRef={blockRef}
              preview={preview}
              onPreview={setPreview}
            />
          )}
        </BlockInnerContainer>
      </PlateElement>
    );

    if (readOnly) {
      return content;
    }

    return (
      // OVERRIDE (824)
      <TableWidthHandleContext.Provider value={resizable}>
        <TableFloatingToolbar>{content}</TableFloatingToolbar>
      </TableWidthHandleContext.Provider>
    );
  },
);

// OVERRIDE (824): the handle on the right edge of the table, centred on the
// edge (a child of the table's inner container, outside the scroll
// container; the last column has no column resize handle on that edge,
// see TableCellElement). The drag starts at the rendered width of the inner
// container, whose left edge stays at the text column (#826): the width
// follows the pointer one to one. It is kept between the text column and
// the room and snaps to the step widths. Plate's
// ResizeHandle reports the drag (`delta` since mousedown, `finished` on
// mouseup). A label at the handle shows the width or the step while
// dragging. No keyboard resizing: the width menu sets the steps.
function TableWidthHandle({
  blockRef,
  preview,
  onPreview,
}: {
  blockRef: React.RefObject<HTMLDivElement | null>;
  preview: TablePreview | null;
  onPreview: (preview: TablePreview | null) => void;
}) {
  const intl = useIntl();
  const editor = useEditorRef();
  const element = useElement<TTableElement>();
  const start = React.useRef<{ width: number; steps: StepWidths } | null>(null);
  const shown = React.useRef<TablePreview | null>(null);
  // A handle that goes away during a drag (the window became too narrow
  // for it) never sees the mouseup: the preview ends with it, nothing is
  // stored.
  React.useEffect(() => () => onPreview(null), [onPreview]);
  // The handle's options are stable (a ref for the element), so Plate's
  // handle does not re-add its window listeners on every render.
  const elementRef = React.useRef(element);
  elementRef.current = element;
  const begin = React.useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      const block = blockRef.current;
      const inner = (event.currentTarget as HTMLElement).parentElement;
      if (!block || !inner) return;
      start.current = {
        width: inner.getBoundingClientRect().width,
        steps: measureStepWidths(block),
      };
    },
    [blockRef],
  );
  const onResize = React.useCallback(
    ({ delta, finished }: { delta: number; finished: boolean }) => {
      const element = elementRef.current;
      const current = start.current;
      if (!current) return;
      // Only the frame's right edge moves (the table is left-aligned with
      // the text column), so the width changes by the pointer's way.
      const next = dragWidth(current.width + delta, current.steps);
      if (!finished) {
        // The label shows what releasing here stores: nothing for a drag
        // that changes nothing (see `dragChange`), so then the table's
        // width as it is.
        const unchanged =
          dragChange(element, next, {
            startWidth: current.width,
            room: current.steps.room,
            text: current.steps.text,
          }) === null;
        // Only a new width, step or label re-renders the table (and its
        // toolbar), not every mouse move.
        const last = shown.current;
        if (
          last?.width !== next.width ||
          last?.step !== next.step ||
          last?.unchanged !== unchanged
        ) {
          shown.current = { ...next, unchanged };
          onPreview(shown.current);
        }
        return;
      }
      start.current = null;
      shown.current = null;
      onPreview(null);
      // A click without a move changes nothing.
      if (delta !== 0) storeDraggedWidth(editor, element, next, current);
    },
    [editor, onPreview],
  );
  const options = React.useMemo(
    () => ({
      direction: 'right' as const,
      onResize,
      onMouseDown: (event: React.MouseEvent) => {
        // Keep the caret where it is (like the toolbar buttons).
        event.preventDefault();
        begin(event);
      },
      onTouchStart: begin,
    }),
    [onResize, begin],
  );
  const storedWidth = customWidthOf(element);
  const storedStep = (element as Record<string, unknown>)[BLOCK_WIDTH_KEY];
  const shownWidth = preview?.unchanged ? storedWidth : preview?.width;
  const shownStep = preview?.unchanged
    ? storedWidth
      ? null
      : typeof storedStep === 'string'
        ? storedStep
        : 'default'
    : preview?.step;
  const stepMessage = shownStep
    ? TABLE_WIDTHS.find((item) => item.value === shownStep)?.message
    : undefined;
  const label = intl.formatMessage(messages.resizeTable);

  return (
    <ResizeHandle
      options={options}
      className="wiki-table-resize-handle"
      contentEditable={false}
      suppressContentEditableWarning
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      title={preview ? undefined : label}
    >
      {preview && (
        <span className="wiki-table-resize-label">
          {stepMessage
            ? intl.formatMessage(stepMessage)
            : formatPx(intl, shownWidth ?? preview.width)}
        </span>
      )}
    </ResizeHandle>
  );
}

function TableFloatingToolbar({
  children,
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  const { editor, tf } = useEditorPlugin(TablePlugin);
  const intl = useIntl();
  const selected = useSelected();
  const element = useElement<TTableElement>();
  const { props: buttonProps } = useRemoveNodeButton({ element });
  const collapsedInside = useEditorSelector(
    (editor) => selected && editor.api.isCollapsed(),
    [selected],
  );
  const isFocusedLast = useFocusedLast();

  const { canMerge, canSplit } = useTableMergeState();

  // OVERRIDE: where the caret is, for the move buttons (row / column index,
  // table size, header row, merged cells).
  const position = useEditorSelector(
    (editor) => {
      const entries = getTableEntries(editor);
      if (!entries) return null;
      const table = entries.table[0] as TElement;
      return {
        tablePath: (entries.table[1] as number[]).join('.'),
        row: (entries.row[1] as number[]).at(-1) as number,
        col: (entries.cell[1] as number[]).at(-1) as number,
        rows: table.children.length,
        cols: (table.children[0] as TElement | undefined)?.children.length ?? 0,
        header: isHeaderRow(table.children[0] as TElement | undefined),
        merged: hasMergedCells(table),
        // OVERRIDE (750): footer row and sum cell
        footer: isFooterRow(table.children.at(-1) as TElement | undefined),
        inFooter:
          isFooterRow(table.children.at(-1) as TElement | undefined) &&
          (entries.row[1] as number[]).at(-1) === table.children.length - 1,
        calc: calcOf(entries.cell[0] as TElement),
      };
    },
    [],
    { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
  );
  const firstBodyRow = position?.header ? 1 : 0;
  // OVERRIDE (750): the footer row stays last.
  const lastBodyRow = position
    ? position.rows - 1 - (position.footer ? 1 : 0)
    : 0;
  const canMoveRowUp =
    !!position && !position.inFooter && position.row > firstBodyRow;
  const canMoveRowDown =
    !!position && position.row >= firstBodyRow && position.row < lastBodyRow;
  const canMoveColumnLeft = !!position && !position.merged && position.col > 0;
  const canMoveColumnRight =
    !!position && !position.merged && position.col < position.cols - 1;
  const tablePathOf = () =>
    position ? position.tablePath.split('.').map(Number) : [];

  // OVERRIDE: header row toggle. The first row is a header row when all of
  // its cells are `th` cells. `element` is the table this toolbar belongs to.
  const firstRow = element.children[0] as TTableRowElement | undefined;
  const hasHeaderRow =
    !!firstRow &&
    firstRow.children.every(
      (cell) => (cell as TElement).type === editor.getType(KEYS.th),
    );
  const toggleHeaderRow = () => {
    const tablePath = editor.api.findPath(element);
    if (!tablePath || !firstRow) return;
    const type = editor.getType(hasHeaderRow ? KEYS.td : KEYS.th);
    editor.tf.withoutNormalizing(() => {
      firstRow.children.forEach((_cell, index) => {
        editor.tf.setNodes({ type }, { at: [...tablePath, 0, index] });
      });
    });
  };

  // OVERRIDE (750): footer row toggle, like Excel's "Total Row": on adds an
  // empty footer row (`footer: true`) at the bottom, off removes it. The
  // sum toggle marks the footer cell the caret is in (`calc: 'sum'`),
  // WikiTableCalcPlugin writes the column sum into it.
  const rowCount = element.children.length;
  const lastRow = element.children[rowCount - 1] as
    | TTableRowElement
    | undefined;
  const hasFooterRow = isFooterRow(lastRow as TElement | undefined);
  const toggleFooterRow = () => {
    const tablePath = editor.api.findPath(element);
    if (!tablePath || !lastRow) return;
    if (hasFooterRow) {
      editor.tf.removeNodes({ at: [...tablePath, rowCount - 1] });
      return;
    }
    const cells = lastRow.children.map(() => ({
      type: editor.getType(KEYS.td),
      children: [{ type: editor.getType(KEYS.p), children: [{ text: '' }] }],
    }));
    editor.tf.insertNodes(
      { type: editor.getType(KEYS.tr), [FOOTER_KEY]: true, children: cells },
      { at: [...tablePath, rowCount], select: true },
    );
  };
  const setCalc = (kind: CalcKind | null) => {
    const entries = getTableEntries(editor);
    if (!entries) return;
    const at = entries.cell[1];
    if (kind) editor.tf.setNodes({ [CALC_KEY]: kind }, { at });
    else editor.tf.unsetNodes(CALC_KEY, { at });
  };

  // OVERRIDE (823): table width. The text toolbar's block width button
  // never shows inside a table (its block is the cell's paragraph), so the
  // width is set here, on the table this toolbar belongs to (see
  // `setTableStep`).
  const tableWidth = (element as Record<string, unknown>)[BLOCK_WIDTH_KEY];
  const activeWidth = typeof tableWidth === 'string' ? tableWidth : 'default';
  const activeStep =
    TABLE_WIDTHS.find((step) => step.value === activeWidth) ?? TABLE_WIDTHS[0];
  // OVERRIDE (824): a custom width from the resize handle: no step is
  // checked, the trigger shows a neutral icon and the width in px.
  const customWidth = customWidthOf(element);
  const ActiveWidthIcon = customWidth ? MoveHorizontalIcon : activeStep.icon;
  const widthName = customWidth
    ? formatPx(intl, customWidth)
    : intl.formatMessage(activeStep.message);
  // A width only applies to a top-level block. A table inside a column or
  // another block fills its container, so the buttons are shown disabled.
  const nestedTable = editor.api.findPath(element)?.length !== 1;
  // OVERRIDE (824): an inserted column gets the width of the column it was
  // inserted next to and the stored widths are fitted to the frame, in the
  // insert's undo step (same tick); Plate stored 0 for it (the 120px
  // minimum), so a table whose widths filled its frame scrolled. See
  // `insertedColSizes`. The frame: the step or custom width of a top-level
  // table (as the width menu measures it), the rendered frame of a nested
  // one.
  const insertColumn = (side: 'before' | 'after') => {
    const tablePath = editor.api.findPath(element);
    const block = editor.api.toDOMNode(element);
    const before = element.colSizes as number[] | undefined;
    const frame = !block
      ? undefined
      : tablePath?.length === 1
        ? frameWidthOf(element, measureStepWidths(block))
        : block
            .querySelector('table')
            ?.closest('.block-inner-container')
            ?.getBoundingClientRect().width;
    // Where Plate inserts the column: at the caret cell's first column, or
    // after its last one (a merged cell spans several).
    const cell = getTableEntries(editor)?.cell[0] as
      | TTableCellElement
      | undefined;
    const index = cell
      ? side === 'before'
        ? getCellIndices(editor, cell).col
        : getCellIndices(editor, cell).col +
          editor.getApi(TablePlugin).table.getColSpan(cell)
      : -1;
    tf.insert.tableColumn(side === 'before' ? { before: true } : undefined);
    if (!tablePath || frame === undefined) return;
    const table = editor.api.node<TTableElement>(tablePath)?.[0];
    const colSizes = insertedColSizes(
      before,
      table?.colSizes as number[] | undefined,
      index,
      side,
      frame,
    );
    if (colSizes) editor.tf.setNodes({ colSizes }, { at: tablePath });
  };

  // OVERRIDE (824): a step also removes the custom width, in one undo step.
  // Stored column widths that do not fit the step are scaled down, as a
  // drag does (see `fitColSizes`).
  const setTableWidth = (value: string) => {
    const tablePath = editor.api.findPath(element);
    if (!tablePath) return;
    const block = editor.api.toDOMNode(element);
    const colSizes = block
      ? fitColSizes(
          element.colSizes as number[] | undefined,
          stepWidth(value, measureStepWidths(block)),
        )
      : undefined;
    editor.tf.withoutNormalizing(() => {
      if (colSizes) editor.tf.setNodes({ colSizes }, { at: tablePath });
      setTableStepWithoutCustomWidth(editor, element, tablePath, value);
    });
  };

  // OVERRIDE: only the table holding the selection opens its toolbar.
  // `canMerge` / `canSplit` are editor-wide, so with several tables on
  // the page every table showed a toolbar for a multi-cell selection.
  const toolbarOpen =
    isFocusedLast && selected && (canMerge || canSplit || collapsedInside);

  // OVERRIDE (825): Volto's toolbar and the navigation tree on the left
  // and the sidebar on the right lie over the page and take the clicks of
  // toolbar buttons under them. Radix only avoids the viewport edges, so
  // the panels' extents go in as collision padding. They are measured when
  // the toolbar opens and again while it is open whenever a panel can have
  // moved: a window resize, a class change on `body` (Volto toggles
  // `has-sidebar` / `has-sidebar-collapsed`), on the tree panel or the
  // sidebar container, and the end of their slide transitions. The
  // toolbar's max-width is the space that is left
  // (`--radix-popover-content-available-width`), see `.wiki-table-toolbar`
  // in theme/components/_wikiTable.scss.
  const [panelInsets, setPanelInsets] = React.useState({ left: 0, right: 0 });
  React.useLayoutEffect(() => {
    if (!toolbarOpen) return;
    const rightEdgeOf = (selector: string) =>
      document.querySelector(selector)?.getBoundingClientRect().right ?? 0;
    const measure = () => {
      const sidebar = document
        .querySelector('#sidebar .sidebar-container')
        ?.getBoundingClientRect();
      const next = {
        left: Math.max(
          0,
          rightEdgeOf('#toolbar .toolbar'),
          rightEdgeOf('.navigation-tree-panel'),
        ),
        right: Math.max(0, window.innerWidth - (sidebar?.left ?? Infinity)),
      };
      setPanelInsets((current) =>
        current.left === next.left && current.right === next.right
          ? current
          : next,
      );
    };
    measure();
    window.addEventListener('resize', measure);
    document.addEventListener('transitionend', measure, true);
    const observer = new MutationObserver(measure);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
    for (const selector of [
      '.navigation-tree-panel',
      '#sidebar .sidebar-container',
    ]) {
      const panel = document.querySelector(selector);
      if (panel) {
        observer.observe(panel, {
          attributes: true,
          attributeFilter: ['class', 'style'],
        });
      }
    }
    return () => {
      window.removeEventListener('resize', measure);
      document.removeEventListener('transitionend', measure, true);
      observer.disconnect();
    };
  }, [toolbarOpen]);

  return (
    <Popover open={toolbarOpen} modal={false}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent
        asChild
        onOpenAutoFocus={(e) => e.preventDefault()}
        contentEditable={false}
        collisionPadding={panelInsets}
        {...props}
      >
        {/* OVERRIDE (825): `wiki-table-toolbar` wraps the buttons into a
            second row instead of Plate's hidden horizontal scroll
            (`scrollbar-hide max-w-[80vw] overflow-x-auto`). Tailwind
            version: `flex-wrap max-w-(--radix-popover-content-available-width)`. */}
        <Toolbar
          className={`
            wiki-table-toolbar flex w-auto flex-row rounded-md border bg-popover p-1
            shadow-md
            print:hidden
          `}
          contentEditable={false}
        >
          <ToolbarGroup>
            <ColorDropdownMenu tooltip="Background color">
              <PaintBucketIcon />
            </ColorDropdownMenu>
            {canMerge && (
              <ToolbarButton
                onClick={() => tf.table.merge()}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Merge cells"
              >
                <CombineIcon />
              </ToolbarButton>
            )}
            {canSplit && (
              <ToolbarButton
                onClick={() => tf.table.split()}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Split cell"
              >
                <SquareSplitHorizontalIcon />
              </ToolbarButton>
            )}

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <ToolbarButton tooltip="Cell borders">
                  <Grid2X2Icon />
                </ToolbarButton>
              </DropdownMenuTrigger>

              <DropdownMenuPortal>
                <TableBordersDropdownMenuContent />
              </DropdownMenuPortal>
            </DropdownMenu>

            {/* OVERRIDE: header row toggle */}
            <ToolbarButton
              pressed={hasHeaderRow}
              onClick={toggleHeaderRow}
              onMouseDown={(e) => e.preventDefault()}
              tooltip={intl.formatMessage(messages.headerRow)}
            >
              <PanelTopIcon />
            </ToolbarButton>
            {/* OVERRIDE (750): footer row toggle, sum toggle in the footer */}
            <ToolbarButton
              pressed={hasFooterRow}
              onClick={toggleFooterRow}
              onMouseDown={(e) => e.preventDefault()}
              tooltip={intl.formatMessage(messages.footerRow)}
            >
              <PanelBottomIcon />
            </ToolbarButton>
            {position?.inFooter && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <ToolbarButton
                    pressed={position.calc !== null}
                    tooltip={intl.formatMessage(messages.calculation)}
                  >
                    <SigmaIcon />
                  </ToolbarButton>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent
                    className="min-w-[180px]"
                    onCloseAutoFocus={(e) => {
                      e.preventDefault();
                      editor.tf.focus();
                    }}
                    align="start"
                    side="right"
                    sideOffset={0}
                  >
                    <DropdownMenuRadioGroup
                      value={position.calc ?? 'none'}
                      onValueChange={(value) =>
                        setCalc(value === 'none' ? null : (value as CalcKind))
                      }
                    >
                      <DropdownMenuRadioItem value="none">
                        {intl.formatMessage(messages.none)}
                      </DropdownMenuRadioItem>
                      {CALC_KINDS.map((kind) => (
                        <DropdownMenuRadioItem key={kind} value={kind}>
                          {intl.formatMessage(messages[kind])}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenu>
            )}

            {collapsedInside && (
              <ToolbarGroup>
                <ToolbarButton tooltip="Delete table" {...buttonProps}>
                  {/* OVERRIDE: red, like the other delete actions (#674) */}
                  <Trash2Icon className="wiki-table-delete-icon" />
                </ToolbarButton>
              </ToolbarGroup>
            )}
          </ToolbarGroup>

          {collapsedInside && (
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => {
                  // OVERRIDE: always a body row. Plate copies the header
                  // type of the row above when inserting before it, which
                  // turned the row inserted before row 2 into a second
                  // header row.
                  tf.insert.tableRow({ before: true, header: false });
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Insert row before"
              >
                {/* OVERRIDE: icons, see tableToolbarIcons.tsx (#674; was ArrowUp) */}
                <RowInsertTopIcon />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  // OVERRIDE: always a body row (see above).
                  tf.insert.tableRow({ header: false });
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Insert row after"
              >
                {/* OVERRIDE (was ArrowDown) */}
                <RowInsertBottomIcon />
              </ToolbarButton>
              {/* OVERRIDE: move the row (the caret moves along) */}
              <ToolbarButton
                disabled={!canMoveRowUp}
                onClick={() =>
                  position &&
                  moveRow(editor, tablePathOf(), position.row, position.row - 1)
                }
                onMouseDown={(e) => e.preventDefault()}
                tooltip={intl.formatMessage(messages.moveRowUp)}
              >
                <MoveUp />
              </ToolbarButton>
              <ToolbarButton
                disabled={!canMoveRowDown}
                onClick={() =>
                  position &&
                  moveRow(editor, tablePathOf(), position.row, position.row + 1)
                }
                onMouseDown={(e) => e.preventDefault()}
                tooltip={intl.formatMessage(messages.moveRowDown)}
              >
                <MoveDown />
              </ToolbarButton>
              {/* OVERRIDE: delete last in the group (#674) */}
              <ToolbarButton
                onClick={() => {
                  tf.remove.tableRow();
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Delete row"
              >
                {/* OVERRIDE (was XIcon) */}
                <RowRemoveIcon className="wiki-table-delete-icon" />
              </ToolbarButton>
            </ToolbarGroup>
          )}

          {collapsedInside && (
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => insertColumn('before')}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Insert column before"
              >
                {/* OVERRIDE (was ArrowLeft) */}
                <ColumnInsertLeftIcon />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => insertColumn('after')}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Insert column after"
              >
                {/* OVERRIDE (was ArrowRight) */}
                <ColumnInsertRightIcon />
              </ToolbarButton>
              {/* OVERRIDE: move the column (the caret moves along) */}
              <ToolbarButton
                disabled={!canMoveColumnLeft}
                onClick={() =>
                  position &&
                  moveColumn(
                    editor,
                    tablePathOf(),
                    position.col,
                    position.col - 1,
                  )
                }
                onMouseDown={(e) => e.preventDefault()}
                tooltip={intl.formatMessage(messages.moveColumnLeft)}
              >
                <MoveLeft />
              </ToolbarButton>
              <ToolbarButton
                disabled={!canMoveColumnRight}
                onClick={() =>
                  position &&
                  moveColumn(
                    editor,
                    tablePathOf(),
                    position.col,
                    position.col + 1,
                  )
                }
                onMouseDown={(e) => e.preventDefault()}
                tooltip={intl.formatMessage(messages.moveColumnRight)}
              >
                <MoveRight />
              </ToolbarButton>
              {/* OVERRIDE: delete last in the group (#674) */}
              <ToolbarButton
                onClick={() => {
                  tf.remove.tableColumn();
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Delete column"
              >
                {/* OVERRIDE (was XIcon) */}
                <ColumnRemoveIcon className="wiki-table-delete-icon" />
              </ToolbarButton>
            </ToolbarGroup>
          )}

          {/* OVERRIDE (823, 825): table width, one dropdown. The trigger
              shows the icon of the current step; its tooltip, which is also
              its accessible name, says which ("Width: Medium"); the menu
              lists the four steps with their names. A nested table gets the trigger disabled; disabled
              buttons take no pointer events, so the reason is the native
              tooltip of the span around it. */}
          <ToolbarGroup>
            <span
              title={
                nestedTable
                  ? intl.formatMessage(messages.widthNested)
                  : undefined
              }
            >
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <ToolbarButton
                    isDropdown
                    disabled={nestedTable}
                    tooltip={`${intl.formatMessage(messages.width)}: ${widthName}`}
                  >
                    <ActiveWidthIcon className="size-4" />
                  </ToolbarButton>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent
                    className="min-w-[180px]"
                    onCloseAutoFocus={(e) => {
                      e.preventDefault();
                      editor.tf.focus();
                    }}
                    align="end"
                    side="bottom"
                    sideOffset={4}
                    collisionPadding={panelInsets}
                  >
                    <DropdownMenuRadioGroup
                      // OVERRIDE (824): no step checked for a custom width
                      value={customWidth ? '' : activeWidth}
                      onValueChange={setTableWidth}
                    >
                      {TABLE_WIDTHS.map(({ value, icon: Icon, message }) => (
                        <DropdownMenuRadioItem key={value} value={value}>
                          <Icon className="size-4" />
                          {intl.formatMessage(message)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenu>
            </span>
          </ToolbarGroup>
        </Toolbar>
      </PopoverContent>
    </Popover>
  );
}

function TableBordersDropdownMenuContent(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Content>,
) {
  const editor = useEditorRef();
  const {
    getOnSelectTableBorder,
    hasBottomBorder,
    hasLeftBorder,
    hasNoBorders,
    hasOuterBorders,
    hasRightBorder,
    hasTopBorder,
  } = useTableBordersDropdownMenuContentState();

  return (
    <DropdownMenuContent
      className="min-w-[220px]"
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        editor.tf.focus();
      }}
      align="start"
      side="right"
      sideOffset={0}
      {...props}
    >
      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          checked={hasTopBorder}
          onCheckedChange={getOnSelectTableBorder('top')}
        >
          <BorderTopIcon />
          <div>Top Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasRightBorder}
          onCheckedChange={getOnSelectTableBorder('right')}
        >
          <BorderRightIcon />
          <div>Right Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasBottomBorder}
          onCheckedChange={getOnSelectTableBorder('bottom')}
        >
          <BorderBottomIcon />
          <div>Bottom Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasLeftBorder}
          onCheckedChange={getOnSelectTableBorder('left')}
        >
          <BorderLeftIcon />
          <div>Left Border</div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>

      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          checked={hasNoBorders}
          onCheckedChange={getOnSelectTableBorder('none')}
        >
          <BorderNoneIcon />
          <div>No Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasOuterBorders}
          onCheckedChange={getOnSelectTableBorder('outer')}
        >
          <BorderAllIcon />
          <div>Outside Borders</div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}

function ColorDropdownMenu({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) {
  const [open, setOpen] = React.useState(false);

  const editor = useEditorRef();
  const selectedCells = usePluginOption(TablePlugin, 'selectedCells');

  const onUpdateColor = React.useCallback(
    (color: string) => {
      setOpen(false);
      setCellBackground(editor, { color, selectedCells: selectedCells ?? [] });
    },
    [selectedCells, editor],
  );

  const onClearColor = React.useCallback(() => {
    setOpen(false);
    setCellBackground(editor, {
      color: null,
      selectedCells: selectedCells ?? [],
    });
  }, [selectedCells, editor]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton tooltip={tooltip}>{children}</ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <ToolbarMenuGroup label="Colors">
          <ColorDropdownMenuItems
            className="px-2"
            colors={DEFAULT_COLORS}
            updateColor={onUpdateColor}
          />
        </ToolbarMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem className="p-2" onClick={onClearColor}>
            <EraserIcon />
            <span>Clear</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TableRowElement(props: PlateElementProps<TTableRowElement>) {
  const { element } = props;
  const readOnly = useReadOnly();
  const selected = useSelected();
  const editor = useEditorRef();
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    'isSelectionAreaVisible',
  );
  const hasControls = !readOnly && !isSelectionAreaVisible;

  // OVERRIDE: row drag and drop with react-aria (was @platejs/dnd, react-dnd).
  const rowRef = React.useRef<HTMLTableRowElement>(null);
  const { dragProps, dropProps, isDragging, dropLine } = useRowDragAndDrop(
    editor,
    element,
    rowRef,
  );

  return (
    <PlateElement
      {...props}
      ref={useComposedRef(props.ref, rowRef)}
      as="tr"
      className={cn(
        'group/row',
        isDragging && 'opacity-50',
        // OVERRIDE (750)
        isFooterRow(element) && 'wiki-table-footer',
      )}
      attributes={{
        ...props.attributes,
        // OVERRIDE: drop target (react-aria)
        ...dropProps,
        'data-selected': selected ? 'true' : undefined,
      }}
    >
      {/* OVERRIDE: 24px gutter (was w-2), see TableElement. OVERRIDE (824):
          a column of width 0, its grip and drop line sit left of it
          (styled in theme/components/_wikiTable.scss).
          Tailwind version (see TableElement):
          className="w-0 min-w-0 max-w-0 select-none" */}
      {hasControls && (
        <td className="wiki-table-gutter select-none" contentEditable={false}>
          {/* OVERRIDE: no handle on the header row, it stays on top */}
          {/* OVERRIDE (750): nor on the footer row, it stays last */}
          {!isHeaderRow(element) && !isFooterRow(element) && (
            <RowDragHandle dragProps={dragProps} />
          )}
          <RowDropLine position={dropLine} />
        </td>
      )}

      {props.children}
    </PlateElement>
  );
}

// OVERRIDE: react-aria drag handle (was a react-dnd drag source that also
// selected the row on click).
function RowDragHandle({ dragProps }: { dragProps: Record<string, unknown> }) {
  const intl = useIntl();

  return (
    <Button
      {...dragProps}
      type="button"
      variant="outline"
      aria-label={intl.formatMessage(dndMessages.dragRow)}
      className={cn(
        // Tailwind version of wiki-table-row-grip (see TableElement):
        // -left-5 focus-visible:opacity-100 (left of the gutter cell, see TableRowElement)
        'wiki-table-row-grip',
        `
          absolute top-1/2 z-51 h-6 w-4 -translate-y-1/2 p-0
          focus-visible:ring-0 focus-visible:ring-offset-0
        `,
        `
          cursor-grab
          active:cursor-grabbing
        `,
        `
          opacity-0 transition-opacity duration-100
          group-hover/row:opacity-100
          group-has-data-[resizing="true"]/row:opacity-0
        `,
      )}
    >
      <GripVertical className="text-muted-foreground" />
    </Button>
  );
}

// OVERRIDE: react-aria column drag handle, top edge of the first row's cells.
function ColumnDragHandle({
  dragProps,
}: {
  dragProps: Record<string, unknown>;
}) {
  const intl = useIntl();

  return (
    <Button
      {...dragProps}
      type="button"
      variant="outline"
      aria-label={intl.formatMessage(dndMessages.dragColumn)}
      // Styled in theme/components/_wikiTable.scss (see there).
      // Tailwind version (see TableElement):
      // className={cn(
      //   `
      //     absolute -top-3 left-1/2 z-40 h-3 w-6 -translate-x-1/2 p-0
      //     focus-visible:ring-0 focus-visible:ring-offset-0
      //   `,
      //   `
      //     cursor-grab
      //     active:cursor-grabbing
      //   `,
      //   `
      //     opacity-0 transition-opacity duration-100
      //     group-hover:opacity-100
      //     focus-visible:opacity-100
      //   `,
      // )}
      className="wiki-table-col-grip p-0"
    >
      <GripHorizontal className="text-muted-foreground" />
    </Button>
  );
}

// OVERRIDE: column drop position (left / right edge of the target cell).
function ColumnDropLine({ position }: { position: 'before' | 'after' | null }) {
  if (!position) return null;

  return (
    <div
      className={cn(
        // Tailwind version (see TableElement):
        // 'absolute top-0 z-40 h-full w-0.5 bg-brand/50',
        // position === 'before' ? '-left-px' : '-right-px',
        'wiki-table-col-drop-line bg-brand/50',
        position === 'before' ? 'is-before' : 'is-after',
      )}
    />
  );
}

// OVERRIDE: drop position comes from the react-aria drop target.
function RowDropLine({ position }: { position: 'before' | 'after' | null }) {
  if (!position) return null;

  return (
    <div
      className={cn(
        // OVERRIDE (824): `wiki-table-row-drop-line` keeps it in the gutter
        // (the gutter cell has width 0, see TableRowElement).
        'wiki-table-row-drop-line',
        'absolute inset-x-0 left-2 z-50 h-0.5 bg-brand/50',
        position === 'before' ? '-top-px' : '-bottom-px',
      )}
    />
  );
}

// OVERRIDE (824): before a column border is dragged, every column gets its
// rendered width as its stored width, when the stored ones do not render
// as they are (see `seedColSizes`): otherwise the fixed layout stretches
// the dragged column and its border jumps away from the pointer. The
// widths are read from a row without merged cells. Returns whether
// anything was written.
const seedRenderedColSizes = (
  editor: SlateEditor,
  cell: HTMLElement | null,
  element: TElement,
) => {
  const table = cell?.closest('table');
  const path = editor.api.findPath(element);
  if (!table || !path) return false;
  const entry = editor.api.above<TTableElement>({
    at: path,
    match: { type: editor.getType(KEYS.table) },
  });
  if (!entry) return false;
  const [node, tablePath] = entry;
  const columns = getTableColumnCount(node);
  let rendered: number[] | null = null;
  for (const row of Array.from(table.rows)) {
    // The gutter cell of the row grip is not a column.
    const cells = Array.from(row.cells).filter(
      (item) => item.getAttribute('contenteditable') !== 'false',
    );
    if (cells.length === columns && cells.every((item) => item.colSpan === 1)) {
      rendered = cells.map((item) => item.getBoundingClientRect().width);
      break;
    }
  }
  if (!rendered) return false;
  const colSizes = seedColSizes(
    node.colSizes as number[] | undefined,
    rendered,
  );
  if (!colSizes) return false;
  editor.tf.setNodes({ colSizes }, { at: tablePath });
  return true;
};

export function TableCellElement({
  isHeader,
  ...props
}: PlateElementProps<TTableCellElement> & {
  isHeader?: boolean;
}) {
  const { api } = useEditorPlugin(TablePlugin);
  const readOnly = useReadOnly();
  const element = props.element;

  const tableId = useElementSelector(([node]) => node.id as string, [], {
    key: KEYS.table,
  });
  const rowId = useElementSelector(([node]) => node.id as string, [], {
    key: KEYS.tr,
  });
  const isSelectingTable = useBlockSelected(tableId);
  const isSelectingRow = useBlockSelected(rowId) || isSelectingTable;
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    'isSelectionAreaVisible',
  );

  const { borders, colIndex, colSpan, minHeight, rowIndex, selected, width } =
    useTableCellElement();

  // OVERRIDE (824): the right edge of a table with a resize handle
  // (TableWidthHandle) belongs to that handle: its last column gets no
  // column resize handle there, so there is one handle on that edge. A
  // table without one (nested, or where the content area is narrower than
  // the text column) keeps Plate's.
  const hasTableHandle = React.useContext(TableWidthHandleContext);
  const tableColumns = useElementSelector(
    ([node]) => getTableColumnCount(node as TTableElement),
    [],
    { key: KEYS.table },
  );
  // `colIndex` is the cell's last column (Plate's `endingColIndex`).
  const atTableEdge = hasTableHandle && colIndex >= tableColumns - 1;

  // OVERRIDE (824): no left-edge (table indent) handle, see the CHANGELOG.
  const { bottomProps, rightProps } = useTableCellElementResizable({
    colIndex,
    colSpan,
    rowIndex,
  });

  // OVERRIDE: column drag and drop with react-aria, on the first row's
  // cells; not for tables with merged cells.
  const editor = useEditorRef();
  const cellRef = React.useRef<HTMLTableCellElement>(null);

  // OVERRIDE (824): the column resize handles seed the stored column widths
  // from the rendered ones on the first move of a drag
  // (`seedRenderedColSizes`); that move only seeds, the next ones resize
  // from the seeded widths. Plate's write at the end of the drag joins the
  // seed's undo step, so a drag is still one undo step. A click on the
  // border without a move writes nothing (Plate stored the column's width
  // on any mouseup).
  // The handle's options are stable (refs for what changes), so Plate's
  // handle does not re-add its window listeners on every render.
  const drag = React.useRef({ moved: false, seeded: false });
  const plateOnResize = React.useRef(rightProps.options?.onResize);
  plateOnResize.current = rightProps.options?.onResize;
  const elementRef = React.useRef(element);
  elementRef.current = element;
  type ResizeEvent = Parameters<
    NonNullable<NonNullable<typeof rightProps.options>['onResize']>
  >[0];
  const startColumnDrag = React.useCallback(() => {
    drag.current = { moved: false, seeded: false };
  }, []);
  const onColumnResize = React.useCallback(
    (event: ResizeEvent) => {
      const current = drag.current;
      const resize = (e: ResizeEvent) => plateOnResize.current?.(e);
      if (!event.finished) {
        if (!current.moved && event.delta !== 0) {
          current.moved = true;
          current.seeded = seedRenderedColSizes(
            editor,
            cellRef.current,
            elementRef.current,
          );
          // Plate reads the stored widths after the next render.
          if (current.seeded) return;
        }
        if (current.moved) resize(event);
        return;
      }
      drag.current = { moved: false, seeded: false };
      if (!current.moved) return;
      if (current.seeded) {
        editor.tf.withMerging(() => resize(event));
      } else {
        resize(event);
      }
    },
    [editor],
  );
  // Everything Plate passes is kept (`direction`, and `initialSize`, the
  // stored width of a merged cell's last column: without it the handle
  // started from the whole span's width); Plate memoizes its options.
  const plateRightOptions = rightProps.options;
  const rightHandleOptions = React.useMemo(
    () => ({
      ...plateRightOptions,
      onMouseDown: startColumnDrag,
      onTouchStart: startColumnDrag,
      onResize: onColumnResize,
    }),
    [plateRightOptions, startColumnDrag, onColumnResize],
  );
  const tableMerged = useElementSelector(
    ([node]) => hasMergedCells(node as TElement),
    [],
    { key: KEYS.table },
  );
  const columnDnd = useColumnDragAndDrop(
    editor,
    element,
    colIndex,
    rowIndex === 0 && !tableMerged && !readOnly,
    cellRef,
  );
  const hasColumnHandle = rowIndex === 0 && !tableMerged && !readOnly;

  // OVERRIDE (750): a calculated footer cell is computed, not typed into;
  // mark it, and mark it differently when the calculation has no result.
  const inFooter = useElementSelector(
    ([node]) => isFooterRow(node as TElement),
    [],
    { key: KEYS.tr },
  );
  const calcKind = inFooter && !readOnly ? calcOf(element) : null;
  const calcEmpty = !!calcKind && NodeApi.string(element).trim() === '';

  return (
    <PlateElement
      {...props}
      // OVERRIDE
      ref={useComposedRef(props.ref, cellRef)}
      as={isHeader ? 'th' : 'td'}
      className={cn(
        // OVERRIDE (750), styled in theme/components/_wikiTable.scss
        calcKind && 'wiki-table-calc',
        calcEmpty && 'wiki-table-calc-empty',
        // Header cells have always been bold in the editor, but not in the
        // rendered content.
        isHeader && 'font-bold',
        selected && 'before:z-10 before:bg-brand/5',
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
        // OVERRIDE: column drop target (react-aria)
        ...(hasColumnHandle ? columnDnd.dropProps : {}),
        colSpan: api.table.getColSpan(element),
        rowSpan: api.table.getRowSpan(element),
        ...cellBorderAttributes(borders),
      }}
    >
      <div className="block-table__cell-content px-3" style={{ minHeight }}>
        {props.children}
      </div>

      {!isSelectionAreaVisible && (
        <div
          className="group absolute top-0 size-full select-none"
          contentEditable={false}
          suppressContentEditableWarning={true}
        >
          {!readOnly && (
            <>
              {/* OVERRIDE: column drag handle and drop line */}
              {hasColumnHandle && (
                <ColumnDragHandle dragProps={columnDnd.dragProps} />
              )}
              <ColumnDropLine position={columnDnd.dropLine} />
              {!atTableEdge && (
                <ResizeHandle
                  // OVERRIDE (824)
                  {...rightProps}
                  options={rightHandleOptions}
                  className="-top-2 -right-1 h-[calc(100%_+_8px)] w-2"
                  data-col={colIndex}
                />
              )}
              <ResizeHandle {...bottomProps} className="-bottom-1 h-2" />

              {/* OVERRIDE (824): no hover line on the column resize
                  handle (Plate showed a `bg-ring` line on hover and while
                  resizing, `columnResizeVariants`): the col-resize cursor
                  is the only affordance, like the table's resize handle. */}
            </>
          )}
        </div>
      )}

      {isSelectingRow && (
        <div className={blockSelectionVariants()} contentEditable={false} />
      )}
    </PlateElement>
  );
}

export function TableCellHeaderElement(
  props: React.ComponentProps<typeof TableCellElement>,
) {
  return <TableCellElement {...props} isHeader />;
}
