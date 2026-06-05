/**
 * CSV Parser Service
 * 
 * Handles CSV file parsing with PapaParse integration, chunked streaming,
 * and Web Worker support for off-main-thread processing.
 */

import Papa from 'papaparse';
import type { TradeRecord, ParseSummary, ParseError } from '../types';

/**
 * Progress callback for CSV parsing
 */
export interface ParseProgress {
  loaded: number;
  total: number;
  percentage: number;
  recordsParsed: number;
}

/**
 * Configuration for CSV parsing
 */
export interface ParseConfig {
  chunkSize?: number;
  onProgress?: (progress: ParseProgress) => void;
  useWorker?: boolean;
}

/**
 * CSV column mapping to TradeRecord fields
 */
const CSV_FIELD_MAPPING: Record<string, keyof TradeRecord> = {
  'id': 'id',
  'trade_number': 'trade_number',
  'pair_id': 'pair_id',
  'chain_id': 'chain_id',
  'chain_name': 'chain_name',
  'side': 'side',
  'price': 'price',
  'quantity': 'quantity',
  'quote_quantity': 'quote_quantity',
  'created_at': 'created_at',
  'executed_at': 'executed_at',
  'maker_user_id': 'maker_user_id',
  'taker_user_id': 'taker_user_id',
  'maker_order_id': 'maker_user_id', // Extra field in CSV
  'taker_order_id': 'taker_user_id', // Extra field in CSV
  'maker_fee': 'maker_fee',
  'taker_fee': 'taker_fee',
  'maker_fee_asset': 'fee_asset', // Map to fee_asset
  'taker_fee_asset': 'fee_asset', // Map to fee_asset
  'fee_asset': 'fee_asset',
  'tx_hash': 'tx_hash',
  'block_number': 'block_number',
  'is_liquidation': 'is_liquidation',
  'metadata': 'metadata',
};

/**
 * Required fields for a valid TradeRecord
 */
const REQUIRED_FIELDS: (keyof TradeRecord)[] = [
  'id',
  'trade_number',
  'pair_id',
  'chain_id',
  'side',
  'price',
  'quantity',
  'quote_quantity',
  'created_at',
  'executed_at',
];

/**
 * Validates a parsed CSV row and converts it to a TradeRecord
 */
function validateAndConvertRow(
  row: Record<string, any>,
  rowIndex: number,
  errors: ParseError[]
): TradeRecord | null {
  const record: Partial<TradeRecord> = {};
  
  // Check for required fields
  for (const field of REQUIRED_FIELDS) {
    if (row[field] === undefined || row[field] === null || row[field] === '') {
      errors.push({
        row: rowIndex,
        field,
        message: `Required field '${field}' is missing or empty`,
        originalData: JSON.stringify(row),
      });
      return null;
    }
  }
  
  try {
    // Map and convert fields with type validation
    record.id = String(row.id);
    record.trade_number = String(row.trade_number);
    record.pair_id = String(row.pair_id);
    
    // Parse chain_id as number
    const chainId = Number(row.chain_id);
    if (isNaN(chainId)) {
      errors.push({
        row: rowIndex,
        field: 'chain_id',
        message: `Invalid chain_id: ${row.chain_id}`,
        originalData: JSON.stringify(row),
      });
      return null;
    }
    record.chain_id = chainId;
    
    // Optional chain_name - derive from chain_id if not present
    if (row.chain_name) {
      record.chain_name = String(row.chain_name);
    } else {
      // Map common chain IDs to names
      const chainNames: Record<number, string> = {
        1: 'Ethereum',
        56: 'BSC',
        137: 'Polygon',
        42161: 'Arbitrum',
        10: 'Optimism',
        1555: 'Chain-1555', // Custom chain
      };
      record.chain_name = chainNames[chainId] || `Chain-${chainId}`;
    }
    
    // Validate side
    const side = String(row.side).toLowerCase();
    if (side !== 'buy' && side !== 'sell') {
      errors.push({
        row: rowIndex,
        field: 'side',
        message: `Invalid side: ${row.side}. Must be 'buy' or 'sell'`,
        originalData: JSON.stringify(row),
      });
      return null;
    }
    record.side = side as 'buy' | 'sell';
    
    // Parse numeric fields
    const price = Number(row.price);
    const quantity = Number(row.quantity);
    const quote_quantity = Number(row.quote_quantity);
    
    if (isNaN(price) || price < 0) {
      errors.push({
        row: rowIndex,
        field: 'price',
        message: `Invalid price: ${row.price}`,
        originalData: JSON.stringify(row),
      });
      return null;
    }
    
    if (isNaN(quantity) || quantity < 0) {
      errors.push({
        row: rowIndex,
        field: 'quantity',
        message: `Invalid quantity: ${row.quantity}`,
        originalData: JSON.stringify(row),
      });
      return null;
    }
    
    if (isNaN(quote_quantity) || quote_quantity < 0) {
      errors.push({
        row: rowIndex,
        field: 'quote_quantity',
        message: `Invalid quote_quantity: ${row.quote_quantity}`,
        originalData: JSON.stringify(row),
      });
      return null;
    }
    
    record.price = price;
    record.quantity = quantity;
    record.quote_quantity = quote_quantity;
    
    // Timestamps
    record.created_at = String(row.created_at);
    record.executed_at = String(row.executed_at);
    
    // Participants
    record.maker_user_id = String(row.maker_user_id || '');
    record.taker_user_id = String(row.taker_user_id || '');
    
    // Fees
    record.maker_fee = Number(row.maker_fee) || 0;
    record.taker_fee = Number(row.taker_fee) || 0;
    // Use maker_fee_asset or taker_fee_asset, fallback to 'USDC'
    record.fee_asset = String(row.maker_fee_asset || row.taker_fee_asset || row.fee_asset || 'USDC');
    
    // Optional blockchain data
    if (row.tx_hash) {
      record.tx_hash = String(row.tx_hash);
    }
    
    if (row.block_number) {
      const blockNumber = Number(row.block_number);
      if (!isNaN(blockNumber)) {
        record.block_number = blockNumber;
      }
    }
    
    // Liquidation flag
    record.is_liquidation = Boolean(
      row.is_liquidation === true ||
      row.is_liquidation === 'true' ||
      row.is_liquidation === '1' ||
      row.is_liquidation === 1
    );
    
    // Parse metadata if present
    if (row.metadata) {
      try {
        if (typeof row.metadata === 'string' && row.metadata.trim()) {
          // Try to parse JSON metadata
          record.metadata = JSON.parse(row.metadata);
        } else if (typeof row.metadata === 'object') {
          record.metadata = row.metadata;
        }
      } catch (e) {
        // Silently skip invalid metadata - don't warn to avoid console spam
        // For large datasets, metadata parsing errors are non-critical
      }
    }
    
    return record as TradeRecord;
  } catch (error) {
    errors.push({
      row: rowIndex,
      field: 'unknown',
      message: `Error parsing row: ${error instanceof Error ? error.message : 'Unknown error'}`,
      originalData: JSON.stringify(row),
    });
    return null;
  }
}

/**
 * Parses a CSV file and returns validated TradeRecord array
 */
export async function parseCSVFile(
  file: File,
  config: ParseConfig = {}
): Promise<{ records: TradeRecord[]; summary: ParseSummary; errors: ParseError[] }> {
  const {
    chunkSize = 10000,
    onProgress,
    useWorker = false,
  } = config;
  
  const startTime = Date.now();
  const validRecords: TradeRecord[] = [];
  const errors: ParseError[] = [];
  let rowIndex = 0;
  let totalRows = 0;
  
  // Fast mode: reduce validation for large files
  const fastMode = file.size > 100 * 1024 * 1024; // 100MB+
  
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      chunk: (results, parser) => {
        // Process chunk
        const chunkRecords: TradeRecord[] = [];
        
        for (const row of results.data as Record<string, any>[]) {
          rowIndex++;
          totalRows++;
          
          if (fastMode && errors.length > 10) {
            // In fast mode, stop collecting errors after 10
            const record = validateAndConvertRow(row, rowIndex, []);
            if (record) chunkRecords.push(record);
          } else {
            const record = validateAndConvertRow(row, rowIndex, errors);
            if (record) chunkRecords.push(record);
          }
          
          // Stop parsing if too many errors (safety check)
          if (errors.length > 100) {
            parser.abort();
            reject(new Error('Too many parsing errors (>100). File may be corrupted or in wrong format.'));
            return;
          }
        }
        
        validRecords.push(...chunkRecords);
        
        // Report progress
        if (onProgress) {
          const loaded = file.size * (rowIndex / (rowIndex + 1));
          onProgress({
            loaded,
            total: file.size,
            percentage: Math.min(95, (loaded / file.size) * 100),
            recordsParsed: validRecords.length,
          });
        }
      },
      complete: () => {
        const parseTime = Date.now() - startTime;
        
        // Final progress update
        if (onProgress) {
          onProgress({
            loaded: file.size,
            total: file.size,
            percentage: 100,
            recordsParsed: validRecords.length,
          });
        }
        
        const summary: ParseSummary = {
          totalRecords: totalRows,
          validRecords: validRecords.length,
          invalidRecords: errors.length,
          parseTime,
          fileName: file.name,
        };
        
        resolve({ records: validRecords, summary, errors });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
      worker: useWorker,
      chunkSize,
      fastMode: true, // Enable PapaParse fast mode
    });
  });
}

/**
 * Validates CSV file before parsing
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  const validExtensions = ['.csv', '.txt'];
  
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!hasValidType && !hasValidExtension) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a CSV file.',
    };
  }
  
  // Check minimum file size (at least 1 byte)
  if (file.size < 1) {
    return {
      valid: false,
      error: 'File is empty. Please upload a valid CSV file.',
    };
  }
  
  return { valid: true };
}

/**
 * Exports trade records to CSV format
 */
export function exportToCSV(records: TradeRecord[], filename: string): void {
  const csv = Papa.unparse(records, {
    header: true,
    columns: Object.keys(CSV_FIELD_MAPPING),
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
