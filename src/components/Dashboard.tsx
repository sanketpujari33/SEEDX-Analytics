/**
 * Dashboard Main Layout Component
 * 
 * Orchestrates the main dashboard layout with responsive grid.
 */

import React, { Suspense, lazy } from 'react';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';
import numeral from 'numeral';
import { useAnalytics, useWalletAnalytics, useIsAnalyticsLoading, useLoadTradeData, useSetLastLoadedFile } from '../store';
import { ChartErrorBoundary } from './charts/ChartErrorBoundary';
import { parseCSVFile } from '../services/csvParser';
import { WalletTable } from './WalletTable';

// Lazy load chart components
const PairDistributionChart = lazy(() => import('./charts/PairDistributionChart').then(m => ({ default: m.PairDistributionChart })));
const WalletBuySellChart = lazy(() => import('./charts/WalletBuySellChart').then(m => ({ default: m.WalletBuySellChart })));
const WalletRateChart = lazy(() => import('./charts/WalletRateChart').then(m => ({ default: m.WalletRateChart })));
const WalletPnLChart = lazy(() => import('./charts/WalletPnLChart').then(m => ({ default: m.WalletPnLChart })));
const WalletTradeCountChart = lazy(() => import('./charts/WalletTradeCountChart').then(m => ({ default: m.WalletTradeCountChart })));

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, subtitle, className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-lg p-3 ${className}`}>
    <div className="flex items-center justify-between mb-1">
      <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider font-labels">{title}</h3>
      <div className="text-gray-300">{icon}</div>
    </div>
    <div className="text-2xl font-bold leading-tight font-numbers" style={{ color: '#00ff9d' }}>{value}</div>
    {subtitle && <div className="text-[10px] text-gray-500 mt-0.5 whitespace-pre-line leading-tight font-labels">{subtitle}</div>}
  </div>
);

export const Dashboard: React.FC = () => {
  const analytics = useAnalytics();
  const walletAnalytics = useWalletAnalytics();
  const isLoading = useIsAnalyticsLoading();
  const loadTradeData = useLoadTradeData();
  const setLastLoadedFile = useSetLastLoadedFile();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleNewFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const result = await parseCSVFile(file, {
          useWorker: false,
          chunkSize: 10000,
          onProgress: (progress) => {
            console.log(`Parsing: ${progress.percentage.toFixed(0)}%`);
          },
        });
        
        if (result.records.length > 0) {
          loadTradeData(result.records);
          setLastLoadedFile(file.name);
        } else {
          alert('No valid records found in the CSV file');
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error loading file: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setIsUploading(false);
      }
    }
    // Reset input so same file can be loaded again
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full ">
          <div className="flex items-center justify-between max-w-[1800px] mx-auto">
            <h1 className="flex items-center gap-1">
              <span className="text-lg font-bold tracking-wider font-logo" style={{ letterSpacing: '0.15em' }}>
                <span style={{ color: '#00ff9d' }}>SEED</span>
                <span style={{ color: '#6b7280' }}>X</span>
              </span>
              <span className="text-lg font-normal tracking-wide font-logo" style={{ color: '#00ff9d', letterSpacing: '0.05em' }}>Analytics</span>
            </h1>
            <div className="flex items-center gap-6">
              <button className="text-[11px] text-gray-600 hover:text-gray-900 uppercase tracking-wide font-labels">DSC / USDT</button>
              <button 
                onClick={handleNewFileClick}
                disabled={isUploading || isLoading}
                className="text-[11px] text-gray-600 hover:text-gray-900 uppercase tracking-wide flex items-center gap-1 disabled:opacity-50 font-labels"
              >
                {isUploading ? '⏳ Uploading...' : '↻ New File'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-6 py-5">
        <div className="w-full max-w-[1800px] mx-auto space-y-5">
          {/* Dashboard Content */}
          <div className="space-y-5">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Computing analytics... This may take a moment for large datasets.</p>
              </div>
            )}

            {!isLoading && walletAnalytics && analytics && (
              <>
                {/* Top Metrics Row */}
                <div className="grid grid-cols-5 gap-3">
                  <MetricCard
                    title="UNIQUE WALLETS"
                    value={walletAnalytics.uniqueWallets}
                    subtitle="active traders"
                    icon={<Activity className="w-4 h-4" />}
                  />
                  <MetricCard
                    title="TOTAL VOLUME"
                    value={numeral(walletAnalytics.totalVolume).format('0.0a')}
                    subtitle={`DSC\nfilled quantity`}
                    icon={<DollarSign className="w-4 h-4" />}
                  />
                  <MetricCard
                    title="TOTAL TRADES"
                    value={walletAnalytics.totalTrades.toLocaleString()}
                    subtitle={`${walletAnalytics.uniqueWallets} wallets`}
                    icon={<TrendingUp className="w-4 h-4" />}
                  />
                  <MetricCard
                    title="USDT TURNOVER"
                    value={numeral(walletAnalytics.lastTurnover).format('$0.0a')}
                    subtitle="buy + sell side"
                    icon={<Activity className="w-4 h-4" />}
                  />
                  <MetricCard
                    title="BUY/SELL RATIO"
                    value={walletAnalytics.buySellRatio.toFixed(2)}
                    subtitle={`B:${numeral(analytics.overall.buyTrades * analytics.overall.avgTradeValue).format('0.0a')} S:${numeral(analytics.overall.sellTrades * analytics.overall.avgTradeValue).format('0.0a')}`}
                    icon={<TrendingUp className="w-4 h-4" />}
                  />
                </div>

                {/* Volume Overview Section */}
                <div className="space-y-4">
                  <h2 className="text-base font-bold uppercase tracking-widest font-labels text-left" style={{ color: '#00ff9d', letterSpacing: '0.2em' }}>VOLUME OVERVIEW</h2>
                  <div className="grid grid-cols-2 gap-5">
                    {/* Buy vs Sell Volume by Wallet */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-normal text-gray-500 uppercase tracking-wider font-labels text-left">Buy vs Sell Volume by Wallet</h3>
                      <div className="bg-white border border-gray-200 rounded-lg p-5 h-[420px]">
                        <ChartErrorBoundary>
                          <Suspense fallback={<div className="h-full flex items-center justify-center">Loading...</div>}>
                            <WalletBuySellChart wallets={walletAnalytics.walletMetrics} height={370} />
                          </Suspense>
                        </ChartErrorBoundary>
                      </div>
                    </div>

                    {/* Trade Distribution */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-normal text-gray-500 uppercase tracking-wider font-labels text-left">Trade Distribution</h3>
                      <div className="bg-white border border-gray-200 rounded-lg p-5 h-[420px]">
                        <ChartErrorBoundary>
                          <Suspense fallback={<div className="h-full flex items-center justify-center">Loading...</div>}>
                            <PairDistributionChart data={analytics.byPair} height={370} />
                          </Suspense>
                        </ChartErrorBoundary>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Analysis Section */}
                <div className="space-y-4">
                  <h2 className="text-base font-bold uppercase tracking-widest font-labels text-left" style={{ color: '#00ff9d', letterSpacing: '0.2em' }}>PRICE ANALYSIS</h2>
                  <div className="grid grid-cols-3 gap-5">
                    {/* Avg Buy vs Sell Rate */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-normal text-gray-500 uppercase tracking-wider font-labels text-left">Avg Buy vs Sell Rate (USDT)</h3>
                      <div className="bg-white border border-gray-200 rounded-lg p-5 h-[340px]">
                        <ChartErrorBoundary>
                          <Suspense fallback={<div className="h-full flex items-center justify-center">Loading...</div>}>
                            <WalletRateChart wallets={walletAnalytics.walletMetrics} height={290} />
                          </Suspense>
                        </ChartErrorBoundary>
                      </div>
                    </div>

                    {/* Estimated P&L by Wallet */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-normal text-gray-500 uppercase tracking-wider font-labels text-left">Estimated P&L by Wallet (USDT)</h3>
                      <div className="bg-white border border-gray-200 rounded-lg p-5 h-[340px]">
                        <ChartErrorBoundary>
                          <Suspense fallback={<div className="h-full flex items-center justify-center">Loading...</div>}>
                            <WalletPnLChart wallets={walletAnalytics.walletMetrics} height={290} />
                          </Suspense>
                        </ChartErrorBoundary>
                      </div>
                    </div>

                    {/* Trade Count by Wallet */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-normal text-gray-500 uppercase tracking-wider font-labels text-left">Trade Count by Wallet</h3>
                      <div className="bg-white border border-gray-200 rounded-lg p-5 h-[340px]">
                        <ChartErrorBoundary>
                          <Suspense fallback={<div className="h-full flex items-center justify-center">Loading...</div>}>
                            <WalletTradeCountChart wallets={walletAnalytics.walletMetrics} height={290} />
                          </Suspense>
                        </ChartErrorBoundary>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet Breakdown Table */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <WalletTable />
                </div>
              </>
            )}

            {!isLoading && !analytics && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Loaded</h3>
                <p className="text-gray-600">Upload a CSV file to start analyzing your trade data</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
