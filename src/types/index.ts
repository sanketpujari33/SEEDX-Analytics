// Core Trade Data Types
export interface TradeRecord {
  // Primary identifiers
  id: string;
  trade_number: string;
  
  // Trading pair and chain
  pair_id: string;
  chain_id: number;
  chain_name?: string;
  
  // Trade details
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  quote_quantity: number;
  
  // Timestamps
  created_at: string;
  executed_at: string;
  
  // Participants
  maker_user_id: string;
  taker_user_id: string;
  
  // Fees
  maker_fee: number;
  taker_fee: number;
  fee_asset: string;
  
  // Blockchain data
  tx_hash?: string;
  block_number?: number;
  
  // Status flags
  is_liquidation: boolean;
  
  // Metadata
  metadata?: TradeMetadata;
}

export interface TradeMetadata {
  status: 'success' | 'failed' | 'pending';
  revertReason?: string;
  gasUsed?: number;
  gasPrice?: string;
  chainRolledBack?: boolean;
  rollbackTimestamp?: string;
  confirmations?: number;
  errorCode?: string;
}

// Analytics Types
export interface OverallMetrics {
  totalVolume: number;
  totalTrades: number;
  buyTrades: number;
  sellTrades: number;
  avgTradeSize: number;
  avgTradeValue: number;
}

export interface PairMetrics {
  pair_id: string;
  totalVolume: number;
  tradeCount: number;
  avgPrice: number;
  priceRange: { min: number; max: number };
}

export interface ChainMetrics {
  chain_id: number;
  chain_name: string;
  totalVolume: number;
  tradeCount: number;
  avgFee: number;
}

export interface TimeSeriesData {
  timestamps: Date[];
  volumes: number[];
  tradeCounts: number[];
}

export interface FeeMetrics {
  totalMakerFees: number;
  totalTakerFees: number;
  totalFees: number;
  avgFeePerTrade: number;
  feesByAsset: Map<string, number>;
  feesOverTime: { timestamp: Date; amount: number }[];
}

export interface LiquidationMetrics {
  totalLiquidations: number;
  liquidationVolume: number;
  avgLiquidationSize: number;
  liquidationsByPair: Map<string, number>;
  liquidationRate: number;
}

export interface FailureMetrics {
  totalFailures: number;
  failureRate: number;
  failuresByReason: Map<string, number>;
  rollbackCount: number;
  avgGasOnFailure: number;
}

export interface AnalyticsResults {
  overall: OverallMetrics;
  byPair: Map<string, PairMetrics>;
  byChain: Map<string, ChainMetrics>;
  timeSeries: TimeSeriesData;
  fees: FeeMetrics;
  liquidations: LiquidationMetrics;
  failures: FailureMetrics;
}

// Filter Types
export interface FilterCriteria {
  dateRange: { start: Date; end: Date } | null;
  tradingPairs: string[];
  chains: string[];
  side: 'buy' | 'sell' | 'both';
  showLiquidationsOnly: boolean;
  showFailedOnly: boolean;
  searchQuery: string;
}

// CSV Parsing Types
export interface ParseSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  parseTime: number;
  fileName: string;
}

export interface ParseError {
  row: number;
  field: string;
  message: string;
  originalData: string;
}

// Data Store Types
export interface TradeDataStore {
  recordsById: Map<string, TradeRecord>;
  recordsByPair: Map<string, Set<string>>;
  recordsByChain: Map<string, Set<string>>;
  recordsByDate: Map<string, Set<string>>;
  sortedTimestamps: number[];
}

// Time Period Types
export type TimePeriod = 'daily' | 'weekly' | 'monthly';

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  label: string;
  data: number[];
  color?: string;
}

export interface DataPoint {
  x: string | number;
  y: number;
  label?: string;
}
