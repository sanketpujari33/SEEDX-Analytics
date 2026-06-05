/**
 * Trade Record Type Definitions
 * 
 * Core data models for trade transactions and metadata
 */

/**
 * Trade direction
 */
export type TradeSide = 'buy' | 'sell';

/**
 * Transaction status
 */
export type TransactionStatus = 'success' | 'failed' | 'pending';

/**
 * Extended metadata for transaction status and error information
 */
export interface TradeMetadata {
  /** Transaction execution status */
  status: TransactionStatus;
  
  /** Error message if transaction failed */
  revertReason?: string;
  
  /** Gas consumed by the transaction */
  gasUsed?: number;
  
  /** Gas price in wei */
  gasPrice?: string;
  
  /** Whether chain rolled back this transaction */
  chainRolledBack?: boolean;
  
  /** When rollback occurred */
  rollbackTimestamp?: string;
  
  /** Number of block confirmations */
  confirmations?: number;
  
  /** Standardized error code */
  errorCode?: string;
}

/**
 * Complete data model for individual trade transactions
 */
export interface TradeRecord {
  // Primary identifiers
  /** Unique record identifier */
  id: string;
  
  /** Human-readable trade number */
  trade_number: string;
  
  // Trading pair and chain
  /** Trading pair (e.g., "ETH/USDC") */
  pair_id: string;
  
  /** Blockchain chain ID */
  chain_id: number;
  
  /** Human-readable chain name (optional) */
  chain_name?: string;
  
  // Trade details
  /** Trade direction */
  side: TradeSide;
  
  /** Execution price */
  price: number;
  
  /** Base asset quantity */
  quantity: number;
  
  /** Quote asset value (price × quantity) */
  quote_quantity: number;
  
  // Timestamps
  /** ISO 8601 timestamp when order created */
  created_at: string;
  
  /** ISO 8601 timestamp when trade executed */
  executed_at: string;
  
  // Participants
  /** User ID of maker */
  maker_user_id: string;
  
  /** User ID of taker */
  taker_user_id: string;
  
  // Fees
  /** Fee paid by maker */
  maker_fee: number;
  
  /** Fee paid by taker */
  taker_fee: number;
  
  /** Token used for fees */
  fee_asset: string;
  
  // Blockchain data
  /** Transaction hash (optional) */
  tx_hash?: string;
  
  /** Block number where executed */
  block_number?: number;
  
  // Status flags
  /** Whether trade is a liquidation */
  is_liquidation: boolean;
  
  // Metadata
  /** Additional transaction information */
  metadata?: TradeMetadata;
}

/**
 * Optimized data structure for fast lookups and filtering
 */
export interface TradeDataStore {
  /** O(1) lookups by trade ID */
  recordsById: Map<string, TradeRecord>;
  
  /** Fast filtering by trading pair */
  recordsByPair: Map<string, Set<string>>;
  
  /** Fast filtering by blockchain chain */
  recordsByChain: Map<string, Set<string>>;
  
  /** Fast time-based queries */
  recordsByDate: Map<string, Set<string>>;
  
  /** Pre-sorted timestamps for time series */
  sortedTimestamps: number[];
}
