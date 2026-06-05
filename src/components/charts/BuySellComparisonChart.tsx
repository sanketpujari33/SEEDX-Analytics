/**
 * Buy vs Sell Comparison Bar Chart
 * 
 * Displays buy volume vs sell volume comparison.
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import numeral from 'numeral';
import type { OverallMetrics } from '../../types/analytics';

interface BuySellComparisonChartProps {
  data: OverallMetrics;
  height?: number;
}

export const BuySellComparisonChart: React.FC<BuySellComparisonChartProps> = ({
  data,
  height = 300,
}) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // Calculate buy and sell volumes (approximation based on trade counts)
  const buyVolume = (data.totalVolume * data.buyTrades) / data.totalTrades;
  const sellVolume = (data.totalVolume * data.sellTrades) / data.totalTrades;

  const chartData = [
    { name: 'Buy', value: buyVolume, fill: '#10b981' },
    { name: 'Sell', value: sellVolume, fill: '#ef4444' },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(value) => numeral(value).format('0.0a')} />
        <Tooltip formatter={(value) => typeof value === 'number' ? numeral(value).format('$0,0.00') : '0'} />
        <Legend />
        <Bar dataKey="value" fill="#3b82f6" label />
      </BarChart>
    </ResponsiveContainer>
  );
};
