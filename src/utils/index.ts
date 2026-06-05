import { format } from 'date-fns';
import numeral from 'numeral';

/**
 * Format a number as currency with optional decimals
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  const formatString = decimals === 0 ? '0,0' : `0,0.${'0'.repeat(decimals)}`;
  return `$${numeral(value).format(formatString)}`;
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(value: number, decimals: number = 2): string {
  const formatString = decimals === 0 ? '0,0' : `0,0.${'0'.repeat(decimals)}`;
  return numeral(value).format(formatString);
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${numeral(value / 100).format(`0.${'0'.repeat(decimals)}%`)}`;
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string, formatString: string = 'MMM dd, yyyy'): string {
  return format(new Date(dateString), formatString);
}

/**
 * Format a date with time
 */
export function formatDateTime(dateString: string): string {
  return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
}

/**
 * Shorten a wallet address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Get blockchain explorer URL for a transaction
 */
export function getExplorerUrl(chainId: number, txHash: string): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/tx/',
    10: 'https://optimistic.etherscan.io/tx/',
    42161: 'https://arbiscan.io/tx/',
    8453: 'https://basescan.org/tx/',
    137: 'https://polygonscan.com/tx/',
  };
  
  const baseUrl = explorers[chainId] || 'https://etherscan.io/tx/';
  return `${baseUrl}${txHash}`;
}

/**
 * Get chain name from chain ID
 */
export function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    1: 'Ethereum',
    10: 'Optimism',
    42161: 'Arbitrum',
    8453: 'Base',
    137: 'Polygon',
  };
  
  return chainNames[chainId] || `Chain ${chainId}`;
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Group array items by a key function
 */
export function groupBy<T>(array: T[], keyFn: (item: T) => string): Map<string, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    const group = acc.get(key) || [];
    group.push(item);
    acc.set(key, group);
    return acc;
  }, new Map<string, T[]>());
}

/**
 * Calculate sum of numeric values from array
 */
export function sum(array: number[]): number {
  return array.reduce((acc, val) => acc + val, 0);
}

/**
 * Calculate average of numeric values from array
 */
export function average(array: number[]): number {
  if (array.length === 0) return 0;
  return sum(array) / array.length;
}

/**
 * Download data as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Re-export data store utilities
export {
  buildDataStore,
  getRecordsByPair,
  getRecordsByChain,
  getRecordsByDate,
  getRecordsByDateRange,
} from './dataStore';

// Re-export date utilities
export { parseFlexibleDate, getTimestamp } from './dateUtils';
