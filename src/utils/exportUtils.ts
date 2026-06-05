/**
 * Export Utilities
 * 
 * Functions for exporting trade data and analytics to various formats.
 */

import Papa from 'papaparse';
import type { TradeRecord } from '../types/trade';
import type { AnalyticsResults } from '../types/analytics';

/**
 * Exports trade records to CSV format and triggers download.
 * 
 * @param records - Trade records to export
 * @param filters - Optional filter description for filename
 */
export function exportToCSV(records: TradeRecord[], filters?: string): void {
  const csv = Papa.unparse(records, {
    header: true,
  });

  const date = new Date().toISOString().split('T')[0];
  const filterSuffix = filters ? `_${filters.replace(/\s+/g, '_')}` : '';
  const filename = `seedx_trades_${date}${filterSuffix}.csv`;

  downloadFile(csv, filename, 'text/csv');
}

/**
 * Exports analytics results to JSON format and triggers download.
 * 
 * @param analytics - Analytics results to export
 * @param filters - Optional filter description for metadata
 */
export function exportAnalyticsJSON(analytics: AnalyticsResults, filters?: Record<string, any>): void {
  // Convert Maps to objects for JSON serialization
  const exportData = {
    exportedAt: new Date().toISOString(),
    appliedFilters: filters || {},
    analytics: {
      overall: analytics.overall,
      byPair: Object.fromEntries(analytics.byPair),
      byChain: Object.fromEntries(analytics.byChain),
      timeSeries: {
        timestamps: analytics.timeSeries.timestamps.map(t => t.toISOString()),
        volumes: analytics.timeSeries.volumes,
        tradeCounts: analytics.timeSeries.tradeCounts,
      },
      fees: {
        ...analytics.fees,
        feesByAsset: Object.fromEntries(analytics.fees.feesByAsset),
        feesOverTime: analytics.fees.feesOverTime.map(f => ({
          timestamp: f.timestamp.toISOString(),
          amount: f.amount,
        })),
      },
      liquidations: {
        ...analytics.liquidations,
        liquidationsByPair: Object.fromEntries(analytics.liquidations.liquidationsByPair),
      },
      failures: {
        ...analytics.failures,
        failuresByReason: Object.fromEntries(analytics.failures.failuresByReason),
      },
    },
  };

  const json = JSON.stringify(exportData, null, 2);
  const date = new Date().toISOString().split('T')[0];
  const filename = `seedx_analytics_${date}.json`;

  downloadFile(json, filename, 'application/json');
}

/**
 * Triggers browser file download.
 * 
 * @param content - File content as string
 * @param filename - Name for the downloaded file
 * @param mimeType - MIME type of the file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
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

/**
 * Opens print dialog with print-friendly styles.
 */
export function printReport(): void {
  window.print();
}
