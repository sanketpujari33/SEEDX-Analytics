/**
 * Filter Manager Service
 * 
 * Manages active filter criteria and applies filters to trade data.
 * Provides state management helpers for filter persistence.
 */

import { getTimestamp } from '../utils/dateUtils';
import type { TradeRecord } from '../types/trade';
import type { FilterCriteria } from '../types/filters';

const STORAGE_KEY = 'seedx_trade_filters';

/**
 * Applies filter criteria to an array of trade records.
 * 
 * Uses sequential filtering with short-circuit evaluation for performance.
 * 
 * @param records - Array of trade records to filter
 * @param criteria - Filter criteria to apply
 * @returns Filtered array of trade records
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.6
 */
export function applyFilters(
  records: TradeRecord[],
  criteria: FilterCriteria
): TradeRecord[] {
  let filtered = records;

  // Date range filtering
  if (criteria.dateRange) {
    const start = criteria.dateRange.start.getTime();
    const end = criteria.dateRange.end.getTime();
    
    filtered = filtered.filter(record => {
      const recordTime = getTimestamp(record.executed_at);
      return recordTime >= start && recordTime <= end;
    });
  }

  // Trading pair filtering
  if (criteria.tradingPairs.length > 0) {
    const pairSet = new Set(criteria.tradingPairs);
    filtered = filtered.filter(record => pairSet.has(record.pair_id));
  }

  // Chain filtering
  if (criteria.chains.length > 0) {
    const chainSet = new Set(criteria.chains.map(c => Number(c)));
    filtered = filtered.filter(record => chainSet.has(record.chain_id));
  }

  // Side filtering
  if (criteria.side !== 'both') {
    filtered = filtered.filter(record => record.side === criteria.side);
  }

  // Liquidations only
  if (criteria.showLiquidationsOnly) {
    filtered = filtered.filter(record => record.is_liquidation);
  }

  // Failed transactions only
  if (criteria.showFailedOnly) {
    filtered = filtered.filter(record => record.metadata?.status === 'failed');
  }

  // Search query (by trade_number or tx_hash)
  if (criteria.searchQuery) {
    const query = criteria.searchQuery.toLowerCase();
    filtered = filtered.filter(record => 
      record.trade_number.toLowerCase().includes(query) ||
      (record.tx_hash && record.tx_hash.toLowerCase().includes(query))
    );
  }

  // Min value filter
  if (criteria.minValue !== undefined && criteria.minValue !== null && criteria.minValue > 0) {
    filtered = filtered.filter(record => record.quote_quantity >= criteria.minValue!);
  }

  // Max value filter
  if (criteria.maxValue !== undefined && criteria.maxValue !== null && criteria.maxValue > 0) {
    filtered = filtered.filter(record => record.quote_quantity <= criteria.maxValue!);
  }

  return filtered;
}

/**
 * Updates a specific filter field in the filter criteria.
 * 
 * @param currentFilters - Current filter criteria
 * @param key - Filter field to update
 * @param value - New value for the field
 * @returns Updated filter criteria
 */
export function updateFilter(
  currentFilters: FilterCriteria,
  key: keyof FilterCriteria,
  value: any
): FilterCriteria {
  return {
    ...currentFilters,
    [key]: value,
  };
}

/**
 * Resets all filters to default values.
 * 
 * @returns Default filter criteria
 */
export function clearFilters(): FilterCriteria {
  return {
    dateRange: null,
    tradingPairs: [],
    chains: [],
    side: 'both',
    showLiquidationsOnly: false,
    showFailedOnly: false,
    searchQuery: '',
  };
}

/**
 * Counts the number of active filters.
 * 
 * @param criteria - Filter criteria to count
 * @returns Number of active filters
 */
export function getActiveFilterCount(criteria: FilterCriteria): number {
  let count = 0;

  if (criteria.dateRange) count++;
  if (criteria.tradingPairs.length > 0) count++;
  if (criteria.chains.length > 0) count++;
  if (criteria.side !== 'both') count++;
  if (criteria.showLiquidationsOnly) count++;
  if (criteria.showFailedOnly) count++;
  if (criteria.searchQuery) count++;

  return count;
}

/**
 * Saves filter criteria to localStorage.
 * 
 * Handles quota exceeded and unavailability errors gracefully.
 * 
 * @param criteria - Filter criteria to save
 * @returns Success status
 * 
 * Validates: Requirements 4.8, 4.9, 10.1, 10.2
 */
export function saveFiltersToStorage(criteria: FilterCriteria): boolean {
  try {
    // Convert date objects to ISO strings for storage
    const storable = {
      ...criteria,
      dateRange: criteria.dateRange
        ? {
            start: criteria.dateRange.start.toISOString(),
            end: criteria.dateRange.end.toISOString(),
          }
        : null,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storable));
    return true;
  } catch (error) {
    // Handle quota exceeded or unavailable
    console.warn('Failed to save filters to localStorage:', error);
    return false;
  }
}

/**
 * Loads filter criteria from localStorage.
 * 
 * Falls back to default filters if unavailable or invalid.
 * 
 * @returns Loaded filter criteria or defaults
 * 
 * Validates: Requirements 4.8, 10.1, 10.2
 */
export function loadFiltersFromStorage(): FilterCriteria {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
      return clearFilters();
    }

    const parsed = JSON.parse(stored);

    // Convert ISO strings back to Date objects
    if (parsed.dateRange) {
      parsed.dateRange = {
        start: new Date(parsed.dateRange.start),
        end: new Date(parsed.dateRange.end),
      };
    }

    return parsed as FilterCriteria;
  } catch (error) {
    console.warn('Failed to load filters from localStorage:', error);
    return clearFilters();
  }
}

/**
 * Clears saved filters from localStorage.
 * 
 * @returns Success status
 */
export function clearStoredFilters(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn('Failed to clear filters from localStorage:', error);
    return false;
  }
}
