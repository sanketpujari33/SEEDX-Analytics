/**
 * Wallet Table Component
 * 
 * Displays wallet breakdown with buy/sell metrics and P&L
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
import { Search } from 'lucide-react';
import numeral from 'numeral';
import { useWalletAnalytics } from '../store';
import type { WalletMetrics } from '../services/walletAnalytics';

const columnHelper = createColumnHelper<WalletMetrics>();

export const WalletTable: React.FC = () => {
  const walletAnalytics = useWalletAnalytics();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');

  if (!walletAnalytics) {
    return (
      <div className="text-center py-8 text-gray-500">
        No wallet data available
      </div>
    );
  }

  const wallets = walletAnalytics.walletMetrics;

  // Define columns
  const columns = useMemo<ColumnDef<WalletMetrics, any>[]>(
    () => [
      columnHelper.display({
        id: 'index',
        header: '#',
        cell: info => (
          <span className="font-medium font-numbers" style={{ color: '#00d4ff' }}>{info.row.index + 1}</span>
        ),
      }),
      columnHelper.accessor('walletAddress', {
        header: 'WALLET',
        cell: info => (
          <span className="font-mono text-sm font-labels" style={{ color: '#00d4ff' }}>
            {info.getValue().slice(0, 10)}...{info.getValue().slice(-6)}
          </span>
        ),
      }),
      columnHelper.accessor('buyQty', {
        header: 'BUY QTY',
        cell: info => (
          <span className="font-numbers" style={{ color: '#10b981' }}>
            {numeral(info.getValue()).format('0.00')}
          </span>
        ),
      }),
      columnHelper.accessor('sellQty', {
        header: 'SELL QTY',
        cell: info => (
          <span className="font-numbers" style={{ color: '#ef4444' }}>
            {numeral(info.getValue()).format('0.00')}
          </span>
        ),
      }),
      columnHelper.accessor('totalVolume', {
        header: 'TOTAL VOL',
        cell: info => (
          <span className="text-gray-500 font-numbers">{numeral(info.getValue()).format('0.00')}</span>
        ),
      }),
      columnHelper.accessor('avgBuyRate', {
        header: 'AVG BUY ↕',
        cell: info => {
          const value = info.getValue();
          return value > 0 ? (
            <span className="font-numbers" style={{ color: '#10b981' }}>{numeral(value).format('0.000000')}</span>
          ) : (
            <span className="text-gray-400">—</span>
          );
        },
      }),
      columnHelper.accessor('avgSellRate', {
        header: 'AVG SELL ↕',
        cell: info => {
          const value = info.getValue();
          return value > 0 ? (
            <span className="font-numbers" style={{ color: '#ef4444' }}>{numeral(value).format('0.000000')}</span>
          ) : (
            <span className="text-gray-400">—</span>
          );
        },
      }),
      columnHelper.accessor('buyUsdt', {
        header: 'BUY USDT',
        cell: info => (
          <span className="text-gray-700 font-numbers">
            {numeral(info.getValue()).format('$0.00')}
          </span>
        ),
      }),
      columnHelper.accessor('sellUsdt', {
        header: 'SELL USDT',
        cell: info => (
          <span className="text-gray-700 font-numbers">
            {numeral(info.getValue()).format('$0.00')}
          </span>
        ),
      }),
      columnHelper.accessor('estimatedPnl', {
        header: 'EST. P&L',
        cell: info => {
          const value = info.getValue();
          const isPositive = value >= 0;
          return (
            <span className={`font-semibold font-numbers`} style={{ color: isPositive ? '#10b981' : '#ef4444' }}>
              {isPositive ? '+' : ''}{numeral(value).format('$0.00')}
            </span>
          );
        },
      }),
      columnHelper.accessor('tradeCount', {
        header: 'TRADES',
        cell: info => (
          <span className="font-numbers" style={{ color: '#00d4ff' }}>{info.getValue()}</span>
        ),
      }),
    ],
    []
  );

  // Filter wallets by search query
  const filteredWallets = useMemo(() => {
    if (!searchQuery) return wallets;
    
    const query = searchQuery.toLowerCase();
    return wallets.filter(w =>
      w.walletAddress.toLowerCase().includes(query)
    );
  }, [wallets, searchQuery]);

  const table = useReactTable({
    data: filteredWallets,
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
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-3">
      {/* Header with Search */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-bold uppercase tracking-widest font-labels" style={{ color: '#00ff9d', letterSpacing: '0.2em' }}>WALLET BREAKDOWN</h2>
          <h3 className="text-[11px] font-normal text-gray-500 uppercase tracking-wider font-labels mt-1">All Wallets — DSC/USDT</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search wallet address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-labels"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 font-labels"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <span className="text-[10px]">
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
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-3 py-2 whitespace-nowrap text-xs">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400 font-labels">
          {filteredWallets.length} wallets
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1.5 text-xs text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-600 font-labels"
          >
            ← Prev
          </button>
          
          {/* Page Numbers */}
          <div className="flex items-center gap-2">
            {Array.from({ length: table.getPageCount() }, (_, i) => i + 1).map((pageNum) => {
              const currentPage = table.getState().pagination.pageIndex + 1;
              const isActive = pageNum === currentPage;
              
              // Show first page, last page, current page, and pages around current
              const showPage = 
                pageNum === 1 || 
                pageNum === table.getPageCount() || 
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
              
              if (!showPage) {
                // Show ellipsis
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="text-xs text-gray-400">...</span>;
                }
                return null;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => table.setPageIndex(pageNum - 1)}
                  className={`px-3 py-1.5 text-xs rounded font-labels ${
                    isActive
                      ? 'border-2 font-semibold'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  style={isActive ? { 
                    borderColor: '#00ff9d', 
                    color: '#374151',
                    backgroundColor: 'white'
                  } : {}}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1.5 text-xs text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-600 font-labels"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};
