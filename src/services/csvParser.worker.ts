/**
 * Web Worker for CSV Parsing
 * 
 * Handles CSV parsing in a separate thread to keep the main UI responsive
 * during large file processing.
 */

import Papa from 'papaparse';

export interface WorkerMessage {
  type: 'parse' | 'cancel';
  file?: File;
  chunkSize?: number;
}

export interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  data?: any;
  error?: string;
  progress?: {
    loaded: number;
    total: number;
    percentage: number;
    recordsParsed: number;
  };
}

// Handle messages from main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, file, chunkSize = 1000 } = event.data;
  
  if (type === 'parse' && file) {
    parseCSVInWorker(file, chunkSize);
  }
};

/**
 * Parse CSV file in worker thread
 */
function parseCSVInWorker(file: File, chunkSize: number): void {
  const validRecords: any[] = [];
  let rowIndex = 0;
  
  Papa.parse(file, {
    header: true,
    dynamicTyping: false,
    skipEmptyLines: true,
    chunk: (results) => {
      // Process chunk
      for (const row of results.data as Record<string, any>[]) {
        rowIndex++;
        validRecords.push(row); // Basic parsing, validation happens in main thread
      }
      
      // Send progress update
      const progress: WorkerResponse = {
        type: 'progress',
        progress: {
          loaded: file.size * (rowIndex / (rowIndex + 1)),
          total: file.size,
          percentage: Math.min(95, (rowIndex / (rowIndex + 1)) * 100),
          recordsParsed: validRecords.length,
        },
      };
      
      self.postMessage(progress);
    },
    complete: () => {
      // Send completion message
      const response: WorkerResponse = {
        type: 'complete',
        data: {
          records: validRecords,
          totalRows: rowIndex,
        },
      };
      
      self.postMessage(response);
    },
    error: (error) => {
      // Send error message
      const response: WorkerResponse = {
        type: 'error',
        error: error.message,
      };
      
      self.postMessage(response);
    },
    worker: false, // Already in worker, don't spawn another
    chunkSize,
  });
}

export {};
