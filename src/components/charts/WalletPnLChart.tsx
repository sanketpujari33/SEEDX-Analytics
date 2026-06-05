/**
 * Wallet P&L Chart
 * 
 * Shows estimated profit/loss by wallet
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import numeral from 'numeral';
import type { WalletMetrics } from '../../services/walletAnalytics';

interface WalletPnLChartProps {
  wallets: WalletMetrics[];
  height?: number;
}

export const WalletPnLChart: React.FC<WalletPnLChartProps> = ({
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

  // Take top 10 wallets by absolute P&L
  const topWallets = [...wallets]
    .sort((a, b) => Math.abs(b.estimatedPnl) - Math.abs(a.estimatedPnl))
    .slice(0, 10);

  // Transform data for chart
  const chartData = topWallets.map(wallet => ({
    wallet: wallet.walletAddress.slice(0, 6) + '...',
    pnl: wallet.estimatedPnl,
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
        <YAxis tickFormatter={(value) => numeral(value).format('0.0a')} fontSize={8} />
        <Tooltip 
          formatter={(value) => typeof value === 'number' ? numeral(value).format('$0,0.00') : '0'}
        />
        <Bar dataKey="pnl" name="Est. P&L">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#00ff9d' : '#ff6b9d'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
