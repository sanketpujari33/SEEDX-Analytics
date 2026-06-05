/**
 * Wallet Buy vs Sell Volume Chart
 * 
 * Shows buy and sell volumes grouped by wallet addresses
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import numeral from 'numeral';
import type { WalletMetrics } from '../../services/walletAnalytics';

interface WalletBuySellChartProps {
  wallets: WalletMetrics[];
  height?: number;
}

export const WalletBuySellChart: React.FC<WalletBuySellChartProps> = ({
  wallets,
  height = 300,
}) => {
  if (!wallets || wallets.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // Take top 10 wallets by volume
  const topWallets = wallets.slice(0, 10);

  // Transform data for chart
  const chartData = topWallets.map(wallet => ({
    wallet: wallet.walletAddress.slice(0, 6) + '...' + wallet.walletAddress.slice(-4),
    buy: wallet.buyUsdt,
    sell: wallet.sellUsdt,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="wallet" 
          angle={-45}
          textAnchor="end"
          height={70}
          interval={0}
          fontSize={9}
        />
        <YAxis tickFormatter={(value) => numeral(value).format('0.0a')} fontSize={9} />
        <Tooltip 
          formatter={(value) => typeof value === 'number' ? numeral(value).format('$0,0.00') : '0'}
        />
        <Legend wrapperStyle={{ fontSize: '10px' }} />
        <Bar dataKey="buy" fill="#00ff9d" name="Buy" />
        <Bar dataKey="sell" fill="#ff6b9d" name="Sell" />
      </BarChart>
    </ResponsiveContainer>
  );
};
