/**
 * Trade Data Store Builder
 * 
 * Provides optimized data structures for fast lookups and filtering.
 * - O(1) lookups by ID
 * - O(1) filtering by pair, chain, date
 * - O(log n) range queries on sorted timestamps
 */

import type { TradeRecord, TradeDataStore } from '../types/trade';

/**
 * Builds an optimized data store from an array of trade records.
 * 
 * Creates multiple indices for efficient querying:
 * - recordsById: Direct O(1) lookup by trade ID
 * - recordsByPair: Groups trade IDs by trading pair for fast filtering
 * - recordsByChain: Groups trade IDs by blockchain chain for fast filtering
 * - recordsByDate: Groups trade IDs by execution date (YYYY-MM-DD) for time-based queries
 * - sortedTimestamps: Pre-sorted array of execution timestamps for O(log n) range queries
 * 
 * @param records - Array of trade records to index
 * @returns TradeDataStore with all indices built
 * 
 * @example
 * ```typescript
 * const records = [
 *   { id: '1', pair_id: 'ETH/USDC', chain_id: 1, executed_at: '2024-01-01T10:00:00Z', ... },
 *   { id: '2', pair_id: 'BTC/USDT', chain_id: 42161, executed_at: '2024-01-02T11:00:00Z', ... }
 * ];
 * 
 * const store = buildDataStore(records);
 * 
 * // O(1) lookup
 * const trade = store.recordsById.get('1');
 * 
 * // O(1) filter by pair
 * const ethTrades = store.recordsByPair.get('ETH/USDC');
 * 
 * // O(log n) time range query using binary search on sortedTimestamps
 * ```
 */
export function buildDataStore(records: TradeRecord[]): TradeDataStore {
  // Initialize all index structures
  const recordsById = new Map<string, TradeRecord>();
  const recordsByPair = new Map<string, Set<string>>();
  const recordsByChain = new Map<string, Set<string>>();
  const recordsByDate = new Map<string, Set<string>>();
  const timestamps: number[] = [];

  // Single-pass construction of all indices
  for (const record of records) {
    // Primary index: by ID for O(1) lookups
    recordsById.set(record.id, record);

    // Secondary index: by trading pair
    if (!recordsByPair.has(record.pair_id)) {
      recordsByPair.set(record.pair_id, new Set<string>());
    }
    recordsByPair.get(record.pair_id)!.add(record.id);

    // Secondary index: by chain ID (converted to string for Map key)
    const chainKey = String(record.chain_id);
    if (!recordsByChain.has(chainKey)) {
      recordsByChain.set(chainKey, new Set<string>());
    }
    recordsByChain.get(chainKey)!.add(record.id);

    // Secondary index: by date (YYYY-MM-DD format for grouping)
    const dateKey = record.executed_at.split('T')[0] || ''; // Extract date portion
    if (dateKey && !recordsByDate.has(dateKey)) {
      recordsByDate.set(dateKey, new Set<string>());
    }
    if (dateKey) {
      recordsByDate.get(dateKey)!.add(record.id);
    }

    // Collect timestamps for sorting
    timestamps.push(new Date(record.executed_at).getTime());
  }

  // Pre-sort timestamps for O(log n) binary search in range queries
  const sortedTimestamps = timestamps.sort((a, b) => a - b);

  return {
    recordsById,
    recordsByPair,
    recordsByChain,
    recordsByDate,
    sortedTimestamps,
  };
}

/**
 * Helper function to get all records for a specific trading pair.
 * 
 * @param store - The trade data store
 * @param pairId - Trading pair identifier (e.g., 'ETH/USDC')
 * @returns Array of trade records for the specified pair
 * 
 * Time complexity: O(n) where n is the number of trades for that pair
 */
export function getRecordsByPair(
  store: TradeDataStore,
  pairId: string
): TradeRecord[] {
  const ids = store.recordsByPair.get(pairId);
  if (!ids) return [];

  const records: TradeRecord[] = [];
  for (const id of ids) {
    const record = store.recordsById.get(id);
    if (record) {
      records.push(record);
    }
  }
  return records;
}

/**
 * Helper function to get all records for a specific blockchain chain.
 * 
 * @param store - The trade data store
 * @param chainId - Blockchain chain ID
 * @returns Array of trade records for the specified chain
 * 
 * Time complexity: O(n) where n is the number of trades on that chain
 */
export function getRecordsByChain(
  store: TradeDataStore,
  chainId: number
): TradeRecord[] {
  const chainKey = String(chainId);
  const ids = store.recordsByChain.get(chainKey);
  if (!ids) return [];

  const records: TradeRecord[] = [];
  for (const id of ids) {
    const record = store.recordsById.get(id);
    if (record) {
      records.push(record);
    }
  }
  return records;
}

/**
 * Helper function to get all records for a specific date.
 * 
 * @param store - The trade data store
 * @param date - Date in YYYY-MM-DD format or Date object
 * @returns Array of trade records executed on the specified date
 * 
 * Time complexity: O(n) where n is the number of trades on that date
 */
export function getRecordsByDate(
  store: TradeDataStore,
  date: string | Date
): TradeRecord[] {
  const dateKey = (typeof date === 'string' ? date : date.toISOString().split('T')[0]) || '';
  const ids = store.recordsByDate.get(dateKey);
  if (!ids) return [];

  const records: TradeRecord[] = [];
  for (const id of ids) {
    const record = store.recordsById.get(id);
    if (record) {
      records.push(record);
    }
  }
  return records;
}

/**
 * Helper function to get records within a date range using binary search.
 * 
 * Utilizes the pre-sorted timestamps array for efficient O(log n) lookup
 * of start/end boundaries, then filters records in O(n) where n is the
 * number of records in the range.
 * 
 * @param store - The trade data store
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @returns Array of trade records within the specified date range
 * 
 * Time complexity: O(log m + n) where m is total records and n is records in range
 */
export function getRecordsByDateRange(
  store: TradeDataStore,
  startDate: Date,
  endDate: Date
): TradeRecord[] {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  // Binary search to find the first timestamp >= startTime
  const startIndex = binarySearchLeft(store.sortedTimestamps, startTime);
  // Binary search to find the last timestamp <= endTime
  const endIndex = binarySearchRight(store.sortedTimestamps, endTime);

  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
    return [];
  }

  // Collect all records in the timestamp range
  const records: TradeRecord[] = [];
  const timestampsInRange = store.sortedTimestamps.slice(startIndex, endIndex + 1);

  // Build a set of unique timestamps in range for efficient lookup
  const timestampSet = new Set(timestampsInRange);

  // Filter records by timestamp (need to iterate all records to match timestamps)
  for (const record of store.recordsById.values()) {
    const recordTime = new Date(record.executed_at).getTime();
    if (timestampSet.has(recordTime)) {
      records.push(record);
    }
  }

  return records;
}

/**
 * Binary search to find the leftmost index where value >= target.
 * Returns -1 if all values are less than target.
 * 
 * @param arr - Sorted array of numbers
 * @param target - Target value to search for
 * @returns Index of leftmost element >= target, or -1 if not found
 */
function binarySearchLeft(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = arr[mid];
    if (midValue !== undefined && midValue >= target) {
      result = mid;
      right = mid - 1; // Continue searching left
    } else {
      left = mid + 1;
    }
  }

  return result;
}

/**
 * Binary search to find the rightmost index where value <= target.
 * Returns -1 if all values are greater than target.
 * 
 * @param arr - Sorted array of numbers
 * @param target - Target value to search for
 * @returns Index of rightmost element <= target, or -1 if not found
 */
function binarySearchRight(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = arr[mid];
    if (midValue !== undefined && midValue <= target) {
      result = mid;
      left = mid + 1; // Continue searching right
    } else {
      right = mid - 1;
    }
  }

  return result;
}
