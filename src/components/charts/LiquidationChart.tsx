/**
 * Liquidation Chart
 * 
 * Displays liquidation events and volumes with dual axes.
 */

import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import numeral from 'numeral';
import type { LiquidationMetrics } from '../../types/analytics';

interface LiquidationChartProps {
  data: LiquidationMetrics;
  height?: number;
}

export const LiquidationChart: React.FC<LiquidationChartProps> = ({
  data,
  height = 300,
}) => {
  if (!data || data.liquidationsByPair.size === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500">No liquidations</div>
      </div>
    );
  }

  // Transform liquidations by pair data
  const chartData = Array.from(data.liquidationsByPair.entries())
    .map(([pair, count]) => ({
      pair,
      count,
      volume: data.liquidationVolume / data.liquidationsByPair.size, // Approximation
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="pair" />
        <YAxis yAxisId="left" tickFormatter={(value) => numeral(value).format('0a')} />
        <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => numeral(value).format('$0.0a')} />
        <Tooltip
          formatter={(value, name) => [
            typeof value === 'number' 
              ? (name === 'volume' ? numeral(value).format('$0,0.00') : value)
              : '0',
            name === 'volume' ? 'Volume' : 'Count',
          ]}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="count" fill="#f59e0b" name="Liquidations" />
        <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#ef4444" strokeWidth={2} name="Volume" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
