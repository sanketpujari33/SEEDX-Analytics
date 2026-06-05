/**
 * Filter Panel Component
 * 
 * Provides UI controls for filtering trade data by various criteria.
 */

import React from 'react';
import { X, Filter } from 'lucide-react';
import { useFilters, useUpdateFilter, useClearFilters, useFilteredRecords, useTradeRecords } from '../store';
import { getActiveFilterCount } from '../services/filterManager';

export const FilterPanel: React.FC = () => {
  const filters = useFilters();
  const updateFilter = useUpdateFilter();
  const clearFilters = useClearFilters();
  const filteredRecords = useFilteredRecords();
  const allRecords = useTradeRecords();

  const activeCount = getActiveFilterCount(filters);

  // Get unique pairs and chains from all records
  const uniquePairs = Array.from(new Set(allRecords.map(r => r.pair_id)));
  const uniqueChains = Array.from(
    new Map(
      allRecords.map(r => [r.chain_id, { id: r.chain_id, name: r.chain_name || `Chain ${r.chain_id}` }])
    ).values()
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {activeCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Date Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date Range
        </label>
        
        {/* Quick date filters */}
        <div className="grid grid-cols-4 gap-1 mb-2">
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(start.getDate() - 1);
              updateFilter('dateRange', { start, end });
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            24h
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(start.getDate() - 7);
              updateFilter('dateRange', { start, end });
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            7d
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setMonth(start.getMonth() - 1);
              updateFilter('dateRange', { start, end });
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            30d
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setFullYear(start.getFullYear() - 1);
              updateFilter('dateRange', { start, end });
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            1y
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={filters.dateRange?.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const start = e.target.value ? new Date(e.target.value) : null;
              updateFilter('dateRange', start && filters.dateRange?.end ? { start, end: filters.dateRange.end } : null);
            }}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Start date"
          />
          <input
            type="date"
            value={filters.dateRange?.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const end = e.target.value ? new Date(e.target.value) : null;
              updateFilter('dateRange', end && filters.dateRange?.start ? { start: filters.dateRange.start, end } : null);
            }}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="End date"
          />
        </div>
        
        {/* Show selected range info */}
        {filters.dateRange && (
          <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
            📅 {filters.dateRange.start.toLocaleDateString()} - {filters.dateRange.end.toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Trading Pairs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Trading Pairs {filters.tradingPairs.length > 0 && (
            <span className="text-xs text-blue-600">({filters.tradingPairs.length} selected)</span>
          )}
        </label>
        <select
          multiple
          value={filters.tradingPairs}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            updateFilter('tradingPairs', selected);
          }}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm max-h-32 overflow-y-auto"
          size={4}
        >
          {uniquePairs.map(pair => (
            <option key={pair} value={pair}>{pair}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
        
        {/* Show selected pairs */}
        {filters.tradingPairs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {filters.tradingPairs.map(pair => (
              <span key={pair} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                {pair}
                <button
                  onClick={() => {
                    updateFilter('tradingPairs', filters.tradingPairs.filter(p => p !== pair));
                  }}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chains */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chains {filters.chains.length > 0 && (
            <span className="text-xs text-blue-600">({filters.chains.length} selected)</span>
          )}
        </label>
        <select
          multiple
          value={filters.chains}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            updateFilter('chains', selected);
          }}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm max-h-24 overflow-y-auto"
          size={3}
        >
          {uniqueChains.map(chain => (
            <option key={chain.id} value={chain.id}>{chain.name}</option>
          ))}
        </select>
        
        {/* Show selected chains */}
        {filters.chains.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {filters.chains.map(chainId => {
              const chain = uniqueChains.find(c => c.id === Number(chainId));
              return (
                <span key={chainId} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                  {chain?.name || chainId}
                  <button
                    onClick={() => {
                      updateFilter('chains', filters.chains.filter(c => c !== chainId));
                    }}
                    className="hover:text-purple-900"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Side Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Side
        </label>
        <div className="flex gap-2">
          {['both', 'buy', 'sell'].map(side => (
            <button
              key={side}
              onClick={() => updateFilter('side', side as 'buy' | 'sell' | 'both')}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                filters.side === side
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {side.charAt(0).toUpperCase() + side.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.showLiquidationsOnly}
            onChange={(e) => updateFilter('showLiquidationsOnly', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Show Liquidations Only</span>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.showFailedOnly}
            onChange={(e) => updateFilter('showFailedOnly', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Show Failed Transactions Only</span>
        </label>
      </div>

      {/* Results Count */}
      <div className="pt-4 border-t border-gray-200 space-y-2">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{filteredRecords.length.toLocaleString()}</span> of{' '}
          <span className="font-medium text-gray-900">{allRecords.length.toLocaleString()}</span> trades
        </div>
        
        {/* Progress bar showing filtered percentage */}
        {allRecords.length > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(filteredRecords.length / allRecords.length) * 100}%` }}
            />
          </div>
        )}
        
        {/* Reduction indicator */}
        {filteredRecords.length < allRecords.length && (
          <div className="text-xs text-blue-600">
            🔍 Filtered to {((filteredRecords.length / allRecords.length) * 100).toFixed(1)}% of total
          </div>
        )}
      </div>
    </div>
  );
};
