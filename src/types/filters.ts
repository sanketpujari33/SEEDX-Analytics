/**
 * Filter Type Definitions
 * 
 * Data models for filtering and searching trade data
 */

import type { TradeSide } from './trade';

/**
 * Date range filter
 */
export interface DateRange {
  /** Start date of the range */
  start: Date;
  
  /** End date of the range */
  end: Date;
}

/**
 * Filter criteria for trade data
 */
export interface FilterCriteria {
  /** Date range filter (null means no date filtering) */
  dateRange: DateRange | null;
  
  /** Array of trading pairs to include (empty means all pairs) */
  tradingPairs: string[];
  
  /** Array of chain IDs to include (empty means all chains) */
  chains: string[];
  
  /** Trade side filter */
  side: TradeSide | 'both';
  
  /** Show only liquidation trades */
  showLiquidationsOnly: boolean;
  
  /** Show only failed transactions */
  showFailedOnly: boolean;
  
  /** Search query for trade_number or tx_hash */
  searchQuery: string;
  
  /** Minimum trade value filter (null means no minimum) */
  minValue?: number | null;
  
  /** Maximum trade value filter (null means no maximum) */
  maxValue?: number | null;
}
