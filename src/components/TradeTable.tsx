/**
 * Trade Table Component
 * 
 * Virtualized table with TanStack Table for displaying large trade datasets.
 * Supports sorting, search, pagination, and row expansion.
 */

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import numeral from 'numeral';
import { useFilteredRecords, useTablePageSize, useSetTablePageSize } from '../store';
import type { TradeRecord } from '../types/trade';

const columnHelper = createColumnHelper<TradeRecord>();

// Blockchain explorer URLs
const EXPLORER_URLS: Record<number, string> = {
  1: 'https://etherscan.io/tx/',
  42161: 'https://arbiscan.io/tx/',
  10: 'https://optimistic.etherscan.io/tx/',
  8453: 'https://basescan.org/tx/',
  137: 'https://polygonscan.com/tx/',
};

export const TradeTable: React.FC = () => {
  const records = useFilteredRecords();
  const pageSize = useTablePageSize();
  const setTablePageSize = useSetTablePageSize();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Define columns
  const columns = useMemo<ColumnDef<TradeRecord, any>[]>(
    () => [
      columnHelper.accessor('trade_number', {
        header: 'Trade #',
        cell: info => (
          <span className="font-mono text-sm">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('pair_id', {
        header: 'Pair',
        cell: info => (
          <span className="font-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('chain_id', {
        header: 'Chain',
        cell: info => {
          const chainName = info.row.original.chain_name || `Chain ${info.getValue()}`;
          return <span className="text-sm">{chainName}</span>;
        },
      }),
      columnHelper.accessor('side', {
        header: 'Side',
        cell: info => {
          const side = info.getValue();
          return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              side === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {side.toUpperCase()}
            </span>
          );
        },
      }),
      columnHelper.accessor('price', {
        header: 'Price',
        cell: info => numeral(info.getValue()).format('$0,0.00'),
      }),
      columnHelper.accessor('quantity', {
        header: 'Quantity',
        cell: info => numeral(info.getValue()).format('0,0.0000'),
      }),
      columnHelper.accessor('quote_quantity', {
        header: 'Total Value',
        cell: info => numeral(info.getValue()).format('$0,0.00'),
      }),
      columnHelper.accessor('executed_at', {
        header: 'Executed At',
        cell: info => {
          try {
            const dateStr = info.getValue();
            if (!dateStr || typeof dateStr !== 'string') {
              return 'Invalid Date';
            }
            // Handle PostgreSQL timestamp format: "2026-04-30 17:29:29.269372+00"
            const isoDate = dateStr.replace(' ', 'T').replace(/\+\d{2}(:\d{2})?$/, 'Z');
            const parsedDate = parseISO(isoDate);
            
            // Check if the date is valid before formatting
            if (isNaN(parsedDate.getTime())) {
              return 'Invalid Date';
            }
            
            return format(parsedDate, 'MMM dd, yyyy HH:mm');
          } catch (e) {
            return 'Invalid Date';
          }
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Details',
        cell: ({ row }) => (
          <button
            onClick={() => toggleRowExpansion(row.original.id)}
            className="text-blue-600 hover:text-blue-800"
          >
            {expandedRows.has(row.original.id) ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        ),
      }),
    ],
    [expandedRows]
  );

  // Filter records by search query
  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records;
    
    const query = searchQuery.toLowerCase();
    return records.filter(r =>
      r.trade_number.toLowerCase().includes(query) ||
      (r.tx_hash && r.tx_hash.toLowerCase().includes(query))
    );
  }, [records, searchQuery]);

  const table = useReactTable({
    data: filteredRecords,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
    // Performance optimization: don't recalculate on every render
    autoResetPageIndex: false,
  });

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getExplorerUrl = (chainId: number, txHash: string) => {
    const baseUrl = EXPLORER_URLS[chainId] || EXPLORER_URLS[1];
    return `${baseUrl}${txHash}`;
  };

  const handlePageSizeChange = (newSize: number) => {
    setTablePageSize(newSize);
    table.setPageSize(newSize);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by trade number or tx hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredRecords.length.toLocaleString()} of {records.length.toLocaleString()} trades
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <span>
                          {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row, index) => (
              <React.Fragment key={`${row.original.id}-${index}`}>
                <tr className="hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-gray-900">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                
                {/* Expanded Row Details */}
                {expandedRows.has(row.original.id) && (
                  <tr key={`${row.original.id}-${index}-expanded`}>
                    <td colSpan={columns.length} className="px-4 py-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Maker User ID:</span>
                          <span className="ml-2 text-gray-900 font-mono">{row.original.maker_user_id}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Taker User ID:</span>
                          <span className="ml-2 text-gray-900 font-mono">{row.original.taker_user_id}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Maker Fee:</span>
                          <span className="ml-2 text-gray-900">{numeral(row.original.maker_fee).format('0,0.0000')} {row.original.fee_asset}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Taker Fee:</span>
                          <span className="ml-2 text-gray-900">{numeral(row.original.taker_fee).format('0,0.0000')} {row.original.fee_asset}</span>
                        </div>
                        {row.original.tx_hash && (
                          <div className="col-span-2">
                            <span className="font-medium text-gray-700">Transaction:</span>
                            <a
                              href={getExplorerUrl(row.original.chain_id, row.original.tx_hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                            >
                              <span className="font-mono">{row.original.tx_hash.slice(0, 10)}...{row.original.tx_hash.slice(-8)}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        {row.original.block_number && (
                          <div>
                            <span className="font-medium text-gray-700">Block:</span>
                            <span className="ml-2 text-gray-900">{row.original.block_number.toLocaleString()}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700">Liquidation:</span>
                          <span className="ml-2 text-gray-900">{row.original.is_liquidation ? 'Yes' : 'No'}</span>
                        </div>
                        {row.original.metadata?.status === 'failed' && (
                          <div className="col-span-2 flex items-start gap-2 p-2 bg-red-50 rounded">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                            <div>
                              <div className="font-medium text-red-800">Failed Transaction</div>
                              {row.original.metadata.revertReason && (
                                <div className="text-sm text-red-700 mt-1">{row.original.metadata.revertReason}</div>
                              )}
                              {row.original.metadata.chainRolledBack && (
                                <div className="text-sm text-red-700 mt-1">⚠️ Chain rolled back at {row.original.metadata.rollbackTimestamp}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
