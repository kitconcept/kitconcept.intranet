import type { BlockEditProps } from '@plone/types';

import { CsvTable, type CsvTableData } from './CsvTable';

/**
 * In the editor the block shows the same table as the view. The file is
 * chosen in the sidebar (the block's schema form), so there is nothing to
 * edit inside the block itself. A click selects the block, which opens its
 * form in the sidebar (the block's content is not editable, so Plate does
 * not select it by itself).
 */
const CsvTableEdit = ({
  data,
  onSelectBlock,
}: Pick<BlockEditProps, 'data'> & { onSelectBlock?: () => void }) => (
  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
  <div onClick={onSelectBlock}>
    <CsvTable data={data as CsvTableData} />
  </div>
);

export default CsvTableEdit;
