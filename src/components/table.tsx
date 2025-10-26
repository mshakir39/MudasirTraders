import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { ChevronDownIcon } from 'lucide-react';
import SearchField from './SearchField';
import Button from './button';

interface TableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  enableSearch?: boolean;
  enablePagination?: boolean;
  searchPlaceholder?: string;
  searchParentClassName?: string;
  tableParentClassName?: string;
  buttonOnClick?: () => void;
  buttonTitle?: string;
  showButton?: boolean;
  secondaryButtonOnClick?: () => void;
  secondaryButtonTitle?: string;
  showSecondaryButton?: boolean;
  stockCost?: number;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
}

export function Table<TData>({
  data,
  columns,
  enableSearch = true,
  enablePagination = false,
  searchPlaceholder = 'Search...',
  searchParentClassName,
  tableParentClassName,
  buttonOnClick,
  buttonTitle = 'Create',
  showButton = true,
  secondaryButtonOnClick,
  secondaryButtonTitle = 'Secondary',
  showSecondaryButton = false,
  stockCost,
  pageSize: initialPageSize = 10,
  onRowClick,
  emptyMessage = 'No data found',
}: TableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  });

  // Manual pagination
  const filteredRows = table.getFilteredRowModel().rows;
  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const paginatedRows = React.useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredRows.slice(start, end);
  }, [filteredRows, currentPage, pageSize]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(0);
  }, [globalFilter]);

  return (
    <div className={`flex w-full flex-col ${tableParentClassName}`}>
      {/* Header with Search and Button */}
      {(enableSearch || showButton || stockCost !== undefined) && (
        <div className='mt-6 flex items-center justify-between gap-4'>
          {enableSearch && (
            <div className={`w-80 ${searchParentClassName}`}>
              <SearchField
                value={globalFilter}
                onChange={setGlobalFilter}
                placeholder={searchPlaceholder}
              />
            </div>
          )}
          <div className='flex items-center gap-4'>
            {stockCost !== undefined && stockCost > 0 && (
              <span className='whitespace-nowrap font-bold'>
                Total Stock Cost: {Math.round(stockCost).toLocaleString()}
              </span>
            )}
            {showSecondaryButton && secondaryButtonOnClick && (
              <Button
                variant='outline'
                text={secondaryButtonTitle}
                onClick={secondaryButtonOnClick}
                style={{ borderColor: '#dc2626', color: '#dc2626' }}
                className='hover:bg-red-50'
              />
            )}
            {showButton && buttonOnClick && (
              <Button
                variant='fill'
                text={buttonTitle}
                onClick={buttonOnClick}
              />
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className='mt-6 rounded-lg border border-gray-200'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className='border-b border-gray-200 bg-gray-50'
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className='px-4 py-3 text-left text-sm font-medium text-gray-700'
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center gap-1'
                              : '',
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <ChevronDownIcon
                              className={`h-4 w-4 transition-transform ${
                                header.column.getIsSorted() === 'asc'
                                  ? 'rotate-180 text-blue-600'
                                  : header.column.getIsSorted() === 'desc'
                                    ? 'text-blue-600'
                                    : 'text-gray-400'
                              }`}
                            />
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {(enablePagination ? paginatedRows : filteredRows).map(
                (row, i) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={`border-b border-gray-200 transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    } ${
                      onRowClick
                        ? 'cursor-pointer hover:bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className='px-4 py-3 text-sm text-gray-900'
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                )
              )}
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className='px-4 py-8 text-center text-gray-500'
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {enablePagination && totalPages > 1 && (
        <div className='mt-4 flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
              className='rounded border border-gray-200 px-2 py-1 text-sm'
            >
              {[5, 10, 20, 30, 50].map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
            <span className='text-sm text-gray-600'>entries</span>
          </div>

          <div className='flex items-center gap-2'>
            <button
              className='rounded border border-gray-200 px-3 py-1 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50'
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
            >
              Previous
            </button>
            <div className='flex items-center gap-1'>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i;
                } else if (currentPage < 3) {
                  pageNumber = i;
                } else if (currentPage > totalPages - 4) {
                  pageNumber = totalPages - 5 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`min-w-[32px] rounded px-2 py-1 text-sm ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNumber + 1}
                  </button>
                );
              })}
            </div>
            <button
              className='rounded border border-gray-200 px-3 py-1 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50'
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </button>
          </div>

          <div className='text-sm text-gray-600'>
            Showing {currentPage * pageSize + 1} to{' '}
            {Math.min((currentPage + 1) * pageSize, filteredRows.length)} of{' '}
            {filteredRows.length} entries
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
