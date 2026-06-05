/**
 * Analytics Engine Service
 * 
 * Pure functions for computing metrics, aggregations, and statistical analysis
 * from trade records.
 */

import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { parseFlexibleDate } from '../utils/dateUtils';
import type { TradeRecord } from '../types/trade';
import type { 
  OverallMetrics, 
  PairMetrics, 
  ChainMetrics, 
  FeeMetrics, 
  LiquidationMetrics,
  FailureMetrics,
  TimeSeriesData,
  TimePeriod
} from '../types/analytics';

/**
 * Computes overall trading metrics from an array of trade records.
 * 
 * Calculates:
 * - Total volume in quote currency
 * - Total trade count (buy/sell breakdown)
 * - Average trade size in base currency
 * - Average trade value in quote currency
 * 
 * Handles empty datasets by returning zeros for all metrics.
 * 
 * @param records - Array of trade records to analyze
 * @returns OverallMetrics object with computed statistics
 * 
 * @example
 * ```typescript
 * const records = [
 *   { side: 'buy', quantity: 10, quote_quantity: 1000, ... },
 *   { side: 'sell', quantity: 5, quote_quantity: 500, ... }
 * ];
 * const metrics = computeOverallMetrics(records);
 * // => { totalVolume: 1500, totalTrades: 2, buyTrades: 1, sellTrades: 1, ... }
 * ```
 * 
 * Validates: Requirements 2.1, 2.2, 2.3
 */
export function computeOverallMetrics(records: TradeRecord[]): OverallMetrics {
  // Handle empty dataset edge case
  if (records.length === 0) {
    return {
      totalVolume: 0,
      totalTrades: 0,
      buyTrades: 0,
      sellTrades: 0,
      avgTradeSize: 0,
      avgTradeValue: 0,
    };
  }

  // Single-pass computation for efficiency
  let totalVolume = 0;
  let totalQuantity = 0;
  let buyTrades = 0;
  let sellTrades = 0;

  for (const record of records) {
    totalVolume += record.quote_quantity;
    totalQuantity += record.quantity;
    
    if (record.side === 'buy') {
      buyTrades++;
    } else if (record.side === 'sell') {
      sellTrades++;
    }
  }

  const totalTrades = records.length;
  const avgTradeSize = totalQuantity / totalTrades;
  const avgTradeValue = totalVolume / totalTrades;

  return {
    totalVolume,
    totalTrades,
    buyTrades,
    sellTrades,
    avgTradeSize,
    avgTradeValue,
  };
}

/**
 * Computes trading volume and metrics grouped by trading pair.
 * 
 * Uses a single-pass algorithm for O(n) complexity.
 * 
 * @param records - Array of trade records
 * @returns Map of pair_id to PairMetrics
 * 
 * Validates: Requirements 2.6
 */
export function computeVolumeByPair(records: TradeRecord[]): Map<string, PairMetrics> {
  const pairMap = new Map<string, PairMetrics>();

  for (const record of records) {
    const existing = pairMap.get(record.pair_id);

    if (existing) {
      existing.totalVolume += record.quote_quantity;
      existing.tradeCount++;
      existing.priceRange.min = Math.min(existing.priceRange.min, record.price);
      existing.priceRange.max = Math.max(existing.priceRange.max, record.price);
      
      // Update average price incrementally
      const totalPrice = existing.avgPrice * (existing.tradeCount - 1) + record.price;
      existing.avgPrice = totalPrice / existing.tradeCount;
    } else {
      pairMap.set(record.pair_id, {
        pair_id: record.pair_id,
        totalVolume: record.quote_quantity,
        tradeCount: 1,
        avgPrice: record.price,
        priceRange: { min: record.price, max: record.price },
      });
    }
  }

  return pairMap;
}

/**
 * Computes trading volume and metrics grouped by blockchain chain.
 * 
 * Uses a single-pass algorithm for O(n) complexity.
 * 
 * @param records - Array of trade records
 * @returns Map of chain_id to ChainMetrics
 * 
 * Validates: Requirements 2.7
 */
export function computeVolumeByChain(records: TradeRecord[]): Map<string, ChainMetrics> {
  const chainMap = new Map<string, ChainMetrics>();

  for (const record of records) {
    const chainKey = String(record.chain_id);
    const existing = chainMap.get(chainKey);
    
    const totalFee = record.maker_fee + record.taker_fee;

    if (existing) {
      existing.totalVolume += record.quote_quantity;
      existing.tradeCount++;
      
      // Update average fee incrementally
      const totalFees = existing.avgFee * (existing.tradeCount - 1) + totalFee;
      existing.avgFee = totalFees / existing.tradeCount;
    } else {
      chainMap.set(chainKey, {
        chain_id: record.chain_id,
        chain_name: record.chain_name || `Chain ${record.chain_id}`,
        totalVolume: record.quote_quantity,
        tradeCount: 1,
        avgFee: totalFee,
      });
    }
  }

  return chainMap;
}

/**
 * Computes fee-related metrics from trade records.
 * 
 * @param records - Array of trade records
 * @returns FeeMetrics with aggregated fee data
 * 
 * Validates: Requirements 2.4, 3.6
 */
export function computeFeeMetrics(records: TradeRecord[]): FeeMetrics {
  if (records.length === 0) {
    return {
      totalMakerFees: 0,
      totalTakerFees: 0,
      totalFees: 0,
      avgFeePerTrade: 0,
      feesByAsset: new Map(),
      feesOverTime: [],
    };
  }

  let totalMakerFees = 0;
  let totalTakerFees = 0;
  const feesByAsset = new Map<string, number>();
  const feesOverTime: { timestamp: Date; amount: number }[] = [];

  for (const record of records) {
    totalMakerFees += record.maker_fee;
    totalTakerFees += record.taker_fee;
    
    // Group by fee asset
    const currentAssetTotal = feesByAsset.get(record.fee_asset) || 0;
    feesByAsset.set(
      record.fee_asset,
      currentAssetTotal + record.maker_fee + record.taker_fee
    );
    
    // Track fees over time - only include valid dates
    const timestamp = parseFlexibleDate(record.executed_at);
    if (!isNaN(timestamp.getTime())) {
      feesOverTime.push({
        timestamp,
        amount: record.maker_fee + record.taker_fee,
      });
    }
  }

  const totalFees = totalMakerFees + totalTakerFees;
  const avgFeePerTrade = totalFees / records.length;

  return {
    totalMakerFees,
    totalTakerFees,
    totalFees,
    avgFeePerTrade,
    feesByAsset,
    feesOverTime,
  };
}

/**
 * Computes liquidation-related metrics from trade records.
 * 
 * @param records - Array of trade records
 * @returns LiquidationMetrics with liquidation data
 * 
 * Validates: Requirements 2.5, 3.9
 */
export function computeLiquidationMetrics(records: TradeRecord[]): LiquidationMetrics {
  const liquidations = records.filter(r => r.is_liquidation);
  
  if (liquidations.length === 0) {
    return {
      totalLiquidations: 0,
      liquidationVolume: 0,
      avgLiquidationSize: 0,
      liquidationsByPair: new Map(),
      liquidationRate: 0,
    };
  }

  let liquidationVolume = 0;
  const liquidationsByPair = new Map<string, number>();

  for (const liq of liquidations) {
    liquidationVolume += liq.quote_quantity;
    
    const count = liquidationsByPair.get(liq.pair_id) || 0;
    liquidationsByPair.set(liq.pair_id, count + 1);
  }

  const avgLiquidationSize = liquidationVolume / liquidations.length;
  const liquidationRate = records.length > 0 ? (liquidations.length / records.length) * 100 : 0;

  return {
    totalLiquidations: liquidations.length,
    liquidationVolume,
    avgLiquidationSize,
    liquidationsByPair,
    liquidationRate,
  };
}

/**
 * Computes time-series data with configurable period aggregation.
 * 
 * Supports daily, weekly, and monthly bucketing with down-sampling
 * for chart rendering (max 1000 data points).
 * 
 * @param records - Array of trade records
 * @param period - Time period for aggregation ('daily' | 'weekly' | 'monthly')
 * @returns TimeSeriesData with timestamps, volumes, and trade counts
 * 
 * Validates: Requirements 2.8, 3.2
 */
export function computeTimeSeries(
  records: TradeRecord[],
  period: TimePeriod = 'daily'
): TimeSeriesData {
  if (records.length === 0) {
    return {
      timestamps: [],
      volumes: [],
      tradeCounts: [],
    };
  }

  // Map to aggregate by time bucket
  const buckets = new Map<number, { volume: number; count: number }>();

  for (const record of records) {
    const date = parseFlexibleDate(record.executed_at);
    
    // Skip invalid dates
    if (isNaN(date.getTime())) {
      continue;
    }
    
    let bucketDate: Date;

    // Determine bucket based on period
    switch (period) {
      case 'weekly':
        bucketDate = startOfWeek(date);
        break;
      case 'monthly':
        bucketDate = startOfMonth(date);
        break;
      case 'daily':
      default:
        bucketDate = startOfDay(date);
        break;
    }

    const bucketKey = bucketDate.getTime();
    const existing = buckets.get(bucketKey);

    if (existing) {
      existing.volume += record.quote_quantity;
      existing.count++;
    } else {
      buckets.set(bucketKey, {
        volume: record.quote_quantity,
        count: 1,
      });
    }
  }

  // Convert to arrays and sort by timestamp
  const sortedEntries = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);

  let timestamps = sortedEntries.map(([ts]) => new Date(ts));
  let volumes = sortedEntries.map(([, data]) => data.volume);
  let tradeCounts = sortedEntries.map(([, data]) => data.count);

  // Down-sample if too many data points (> 1000)
  if (timestamps.length > 1000) {
    const step = Math.ceil(timestamps.length / 1000);
    timestamps = timestamps.filter((_, i) => i % step === 0);
    volumes = volumes.filter((_, i) => i % step === 0);
    tradeCounts = tradeCounts.filter((_, i) => i % step === 0);
  }

  return {
    timestamps,
    volumes,
    tradeCounts,
  };
}

/**
 * Computes failure-related metrics from trade metadata.
 * 
 * @param records - Array of trade records
 * @returns FailureMetrics with failure analysis data
 * 
 * Validates: Requirements 8.2, 8.3, 8.5
 */
export function computeFailureMetrics(records: TradeRecord[]): FailureMetrics {
  const failedTrades = records.filter(r => r.metadata?.status === 'failed');
  
  if (failedTrades.length === 0) {
    return {
      totalFailures: 0,
      failureRate: 0,
      failuresByReason: new Map(),
      rollbackCount: 0,
      avgGasOnFailure: 0,
    };
  }

  const failuresByReason = new Map<string, number>();
  let rollbackCount = 0;
  let totalGas = 0;
  let gasCount = 0;

  for (const trade of failedTrades) {
    // Group by revert reason
    const reason = trade.metadata?.revertReason || 'Unknown';
    const count = failuresByReason.get(reason) || 0;
    failuresByReason.set(reason, count + 1);

    // Count rollbacks
    if (trade.metadata?.chainRolledBack) {
      rollbackCount++;
    }

    // Calculate average gas on failure
    if (trade.metadata?.gasUsed) {
      totalGas += trade.metadata.gasUsed;
      gasCount++;
    }
  }

  const failureRate = records.length > 0 ? (failedTrades.length / records.length) * 100 : 0;
  const avgGasOnFailure = gasCount > 0 ? totalGas / gasCount : 0;

  return {
    totalFailures: failedTrades.length,
    failureRate,
    failuresByReason,
    rollbackCount,
    avgGasOnFailure,
  };
}
