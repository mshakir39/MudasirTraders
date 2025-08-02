import * as React from 'react';
import {
  DataGrid,
  GridColDef,
  GridColumnMenu,
  GridColumnMenuItemProps,
  GridColumnMenuProps,
} from '@mui/x-data-grid';
import { useState } from 'react';
import Button from './button';
import { filterItems } from '@/utils/filterItems';
import { v4 as uuidv4 } from 'uuid';
import SearchField from './SearchField';

interface DataGridDemoProps {
  rows: any[];
  columns: any[];
  searchParentClassName?: string;
  tableParentClassName?: string;
  buttonOnClick?: () => void;
  buttonTitle?: string;
  showButton?: boolean;
  stockCost?: number;
  enablePagination?: boolean;
  pageSize?: number;
}

const DataGridDemo = React.memo(function DataGridDemo({
  rows,
  columns,
  searchParentClassName,
  tableParentClassName,
  buttonOnClick,
  buttonTitle = 'Create',
  showButton = true,
  stockCost,
  enablePagination = false,
  pageSize = 5,
  ...rest
}: DataGridDemoProps) {
  const [search, setSearch] = useState<string>('');
  const [filteredRows, setFilteredRows] = useState<any>([]);
  const [timeoutId, setTimeoutId] = useState<any>(null);

  React.useEffect(() => {
    setFilteredRows(rows);
  }, [rows]);

  const handleSearch = (searchQuery: string) => {
    setSearch(searchQuery);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      setFilteredRows(filterItems(rows, searchQuery));
    }, 500); // 500ms debounce
    setTimeoutId(newTimeoutId);
  };

  const gridProps = {
    getRowId: (row: any) => uuidv4(),
    rows: filteredRows,
    columns,
    disableRowSelectionOnClick: true,
    autoHeight: true,
    rowHeight: 52,
    ...rest,
  };

  if (enablePagination) {
    Object.assign(gridProps, {
      initialState: {
        pagination: {
          paginationModel: {
            pageSize: pageSize,
          },
        },
      },
      pageSizeOptions: [pageSize],
      paginationMode: 'client' as const,
    });
  } else {
    // When pagination is disabled, configure grid to show all rows
    Object.assign(gridProps, {
      hideFooter: true,
      hideFooterPagination: true,
      disableColumnFilter: false,
      disableVirtualization: true, // Disable virtualization to show all rows
      rowCount: filteredRows.length,
      initialState: {
        pagination: {
          paginationModel: {
            pageSize: 100000, // Set a very large number to show all rows
          },
        },
      },
    });
  }

  return (
    <div className={`flex w-full flex-col px-4 ${tableParentClassName}`}>
      <div className='mt-6 flex items-center justify-between gap-4'>
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder='Search...'
          className={`w-80 ${searchParentClassName}`}
        />
        <div className='flex items-center gap-4'>
          {Number(stockCost ? stockCost : 0) > 0 && (
            <span className='whitespace-nowrap font-bold'>
              Total Stock Cost: {Math.round(stockCost || 0).toLocaleString()}
            </span>
          )}
          {showButton && (
            <Button variant='fill' text={buttonTitle} onClick={buttonOnClick} />
          )}
        </div>
      </div>

      <div className='mt-6'>
        {filteredRows && filteredRows.length > 0 ? (
          <div style={{ width: '100%', height: '100%' }}>
            <DataGrid {...gridProps} />
          </div>
        ) : (
          <div className='flex w-full justify-center py-8 text-gray-500'>
            No data found
          </div>
        )}
      </div>
    </div>
  );
});

export default DataGridDemo;
