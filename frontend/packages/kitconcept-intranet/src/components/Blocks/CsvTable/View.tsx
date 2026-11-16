import type { BlockViewProps } from '@plone/types';

import { CsvTable, type CsvTableData } from './CsvTable';

const CsvTableView = ({ data }: Pick<BlockViewProps, 'data'>) => (
  <CsvTable data={data as CsvTableData} />
);

export default CsvTableView;
