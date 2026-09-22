/**
 * OVERRIDE table-node-static.tsx
 * REASON: Apply the stored column width as `width` on the cells (Plate
 *         only sets min/max width, which a fixed-layout table ignores), so
 *         resized columns render the same in the view as in the editor.
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
} from 'platejs';

import { BaseTablePlugin } from '@platejs/table';
import { SlateElement } from 'platejs';

import { BlockInnerContainer } from '@plone/plate/components/ui/block-inner-container';
import { cn } from '@plone/plate/lib/utils';

export function TableElementStatic({
  children,
  ...props
}: SlateElementProps<TTableElement>) {
  const { disableMarginLeft } = props.editor.getOptions(BaseTablePlugin);
  const marginLeft = disableMarginLeft ? 0 : props.element.marginLeft;

  return (
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

  const { minHeight, width } = api.table.getCellSize({ element });
  const borders = api.table.getCellBorders({ element });

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
        colSpan: api.table.getColSpan(element),
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
