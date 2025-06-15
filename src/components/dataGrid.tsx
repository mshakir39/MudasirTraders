import * as React from 'react';
import {
  DataGrid,
  GridColDef,
  GridColumnMenu,
  GridColumnMenuItemProps,
  GridColumnMenuProps,
} from '@mui/x-data-grid';
import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import Button from './button';
import { filterItems } from '@/utils/filterItems';
import { v4 as uuidv4 } from 'uuid';

interface DataGridDemoProps {
  rows: any[];
  columns: any[];
  searchParentClassName?: string;
  tableParentClassName?: string;
  buttonOnClick?: () => void;
  buttonTitle?: string;
  showButton?: boolean;
  stockCost?: number;
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
  ...rest
}: DataGridDemoProps) {
  const [search, setSearch] = useState<string>('');
  const [filteredRows, setFilteredRows] = useState<any>([]);
  const [timeoutId, setTimeoutId] = useState<any>(null);

  React.useEffect(() => {
    setFilteredRows(rows);
  }, [rows]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery = event.target.value;
    setSearch(searchQuery);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      setFilteredRows(filterItems(rows, searchQuery));
    }, 500); // 500ms debounce
    setTimeoutId(newTimeoutId);
  };

  // const filterItemsMemoized = React.useCallback(
  //   (items: any[], searchQuery: string) => {
  //     return filterItems(items, searchQuery);
  //   },
  //   []
  // );

  return (
    <div className={`flex w-full flex-col px-4 ${tableParentClassName}`}>
      <div className='mt-6 flex items-center justify-between'>
        <div className={`relative ${searchParentClassName}`}>
          <input
            className='h-10  w-full  rounded-xl p-4 outline-none'
            placeholder='Enter to Search'
            style={{
              boxShadow:
                'rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px',
            }}
            id='search'
            type='text'
            value={search}
            onChange={handleSearch}
          />
          <FaSearch className='absolute bottom-3 right-3 text-[#5b4eea]' />
        </div>
        <div className='flex items-center'>
          {Number(stockCost ? stockCost : 0) > 0 && (
            <span className='mr-4 font-bold'>
              Total Stock Cost :{stockCost}
            </span>
          )}
          {showButton && (
            <Button
              className='my-2'
              variant='fill'
              text={buttonTitle}
              onClick={buttonOnClick}
            />
          )}
        </div>
      </div>

      <br />
      {filteredRows && filteredRows.length > 0 ? (
        <DataGrid
          getRowId={(row) => uuidv4()}
          rows={filteredRows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
              },
            },
          }}
          pageSizeOptions={[5]}
          disableRowSelectionOnClick
          {...rest}
        />
      ) : (
        <div className='flex w-full justify-center'>No Data Found</div>
      )}
    </div>
  );
});

export default DataGridDemo;
