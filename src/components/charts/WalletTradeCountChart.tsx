/**
 * Wallet Trade Count Chart
 * 
 * Shows number of trades per wallet
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WalletMetrics } from '../../services/walletAnalytics';

interface WalletTradeCountChartProps {
  wallets: WalletMetrics[];
  height?: number;
}

export const WalletTradeCountChart: React.FC<WalletTradeCountChartProps> = ({
  wallets,
  height = 200,
}) => {
  if (!wallets || wallets.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // Take top 10 wallets by trade count
  const topWallets = [...wallets]
    .sort((a, b) => b.tradeCount - a.tradeCount)
    .slice(0, 10);

  // Transform data for chart
  const chartData = topWallets.map(wallet => ({
    wallet: wallet.walletAddress.slice(0, 6) + '...',
    trades: wallet.tradeCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 35 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="wallet" 
          angle={-45}
          textAnchor="end"
          height={50}
          interval={0}
          fontSize={8}
        />
        <YAxis fontSize={8} />
        <Tooltip />
        <Bar dataKey="trades" fill="#3b82f6" name="Trades" />
      </BarChart>
    </ResponsiveContainer>
  );
};
