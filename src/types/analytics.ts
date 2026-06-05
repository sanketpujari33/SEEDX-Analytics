/**
 * Analytics Result Type Definitions
 * 
 * Data models for computed analytics and metrics
 */

/**
 * Time period for analytics aggregation
 */
export type TimePeriod = 'daily' | 'weekly' | 'monthly';

/**
 * Overall trading metrics across all trades
 */
export interface OverallMetrics {
  /** Total trading volume in quote currency */
  totalVolume: number;
  
  /** Total number of trades */
  totalTrades: number;
  
  /** Number of buy trades */
  buyTrades: number;
  
  /** Number of sell trades */
  sellTrades: number;
  
  /** Average trade size in base currency */
  avgTradeSize: number;
  
  /** Average trade value in quote currency */
  avgTradeValue: number;
}

/**
 * Trading metrics for a specific trading pair
 */
export interface PairMetrics {
  /** Trading pair identifier */
  pair_id: string;
  
  /** Total volume for this pair */
  totalVolume: number;
  
  /** Number of trades for this pair */
  tradeCount: number;
  
  /** Average price for this pair */
  avgPrice: number;
  
  /** Price range for this pair */
  priceRange: {
    min: number;
    max: number;
  };
}

/**
 * Trading metrics for a specific blockchain chain
 */
export interface ChainMetrics {
  /** Chain ID */
  chain_id: number;
  
  /** Human-readable chain name */
  chain_name: string;
  
  /** Total volume on this chain */
  totalVolume: number;
  
  /** Number of trades on this chain */
  tradeCount: number;
  
  /** Average fee on this chain */
  avgFee: number;
}

/**
 * Time series data for volume and trade count
 */
export interface TimeSeriesData {
  /** Array of timestamps */
  timestamps: Date[];
  
  /** Trading volumes corresponding to timestamps */
  volumes: number[];
  
  /** Trade counts corresponding to timestamps */
  tradeCounts: number[];
}

/**
 * Fee analysis metrics
 */
export interface FeeMetrics {
  /** Total fees paid by makers */
  totalMakerFees: number;
  
  /** Total fees paid by takers */
  totalTakerFees: number;
  
  /** Total fees (maker + taker) */
  totalFees: number;
  
  /** Average fee per trade */
  avgFeePerTrade: number;
  
  /** Fees grouped by asset */
  feesByAsset: Map<string, number>;
  
  /** Fees over time */
  feesOverTime: Array<{
    timestamp: Date;
    amount: number;
  }>;
}

/**
 * Liquidation analysis metrics
 */
export interface LiquidationMetrics {
  /** Total number of liquidation trades */
  totalLiquidations: number;
  
  /** Total volume from liquidations */
  liquidationVolume: number;
  
  /** Average size of liquidation trades */
  avgLiquidationSize: number;
  
  /** Liquidations grouped by trading pair */
  liquidationsByPair: Map<string, number>;
  
  /** Liquidation rate as percentage of total trades */
  liquidationRate: number;
}

/**
 * Failed transaction analysis metrics
 */
export interface FailureMetrics {
  /** Total number of failed transactions */
  totalFailures: number;
  
  /** Failure rate as percentage of total trades */
  failureRate: number;
  
  /** Failures grouped by reason */
  failuresByReason: Map<string, number>;
  
  /** Number of chain rollbacks */
  rollbackCount: number;
  
  /** Average gas used on failed transactions */
  avgGasOnFailure: number;
}

/**
 * Complete analytics results containing all computed metrics
 */
export interface AnalyticsResults {
  /** Overall trading metrics */
  overall: OverallMetrics;
  
  /** Metrics grouped by trading pair */
  byPair: Map<string, PairMetrics>;
  
  /** Metrics grouped by blockchain chain */
  byChain: Map<string, ChainMetrics>;
  
  /** Time series data */
  timeSeries: TimeSeriesData;
  
  /** Fee analysis */
  fees: FeeMetrics;
  
  /** Liquidation analysis */
  liquidations: LiquidationMetrics;
  
  /** Failed transaction analysis */
  failures: FailureMetrics;
}
