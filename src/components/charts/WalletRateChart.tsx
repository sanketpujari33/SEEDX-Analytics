/**
 * Wallet Avg Rate Chart
 * 
 * Shows average buy vs sell rates by wallet
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import numeral from 'numeral';
import type { WalletMetrics } from '../../services/walletAnalytics';

interface WalletRateChartProps {
  wallets: WalletMetrics[];
  height?: number;
}

export const WalletRateChart: React.FC<WalletRateChartProps> = ({
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
  const topWallets = wallets.slice(0, 10);

  // Transform data for chart
  const chartData = topWallets.map(wallet => ({
    wallet: wallet.walletAddress.slice(0, 6) + '...',
    avgBuy: wallet.avgBuyRate,
    avgSell: wallet.avgSellRate,
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
        <YAxis tickFormatter={(value) => numeral(value).format('0.00')} fontSize={8} />
        <Tooltip 
          formatter={(value) => typeof value === 'number' ? numeral(value).format('0.0000') : '0'}
        />
        <Legend wrapperStyle={{ fontSize: '9px' }} />
        <Bar dataKey="avgBuy" fill="#00ff9d" name="Avg Buy" />
        <Bar dataKey="avgSell" fill="#ff6b9d" name="Avg Sell" />
      </BarChart>
    </ResponsiveContainer>
  );
};
