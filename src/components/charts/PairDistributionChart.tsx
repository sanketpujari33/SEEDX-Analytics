/**
 * Pair Distribution Pie Chart
 * 
 * Shows trading volume distribution by trading pair.
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import numeral from 'numeral';
import type { PairMetrics } from '../../types/analytics';

interface PairDistributionChartProps {
  data: Map<string, PairMetrics>;
  onDataPointClick?: (pairId: string) => void;
  height?: number;
}

const COLORS = ['#00ff9d', '#00d4ff', '#ff6b9d', '#ffd93d', '#a78bfa', '#fb923c', '#34d399', '#60a5fa', '#f472b6', '#fbbf24'];

export const PairDistributionChart: React.FC<PairDistributionChartProps> = ({
  data,
  onDataPointClick,
  height = 300,
}) => {
  if (!data || data.size === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // Transform data and take top 10 pairs
  const chartData = Array.from(data.values())
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 10)
    .map((pair, index) => ({
      name: pair.pair_id,
      value: pair.totalVolume,
      color: COLORS[index % COLORS.length],
    }));

  const handleClick = (entry: any) => {
    if (onDataPointClick) {
      onDataPointClick(entry.name);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={(entry) => `${entry.name ? entry.name.slice(0, 8) : ''} (${numeral(entry.value / chartData.reduce((sum, d) => sum + d.value, 0)).format('0%')})`}
          onClick={handleClick}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => typeof value === 'number' ? numeral(value).format('$0,0.00') : '0'} />
        <Legend wrapperStyle={{ fontSize: '9px' }} iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
};
