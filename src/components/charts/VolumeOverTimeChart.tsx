/**
 * Volume Over Time Line Chart
 * 
 * Displays trading volume over time with selectable periods (daily/weekly/monthly).
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import numeral from 'numeral';
import type { TimeSeriesData } from '../../types/analytics';

interface VolumeOverTimeChartProps {
  data: TimeSeriesData;
  isLoading?: boolean;
  height?: number;
}

export const VolumeOverTimeChart: React.FC<VolumeOverTimeChartProps> = ({
  data,
  isLoading = false,
  height = 300,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.timestamps.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // Transform data for Recharts - filter out invalid dates first
  const chartData = data.timestamps
    .map((timestamp, index) => ({
      timestamp,
      volume: data.volumes[index] || 0,
      trades: data.tradeCounts[index] || 0,
    }))
    .filter(item => {
      // Only include items with valid Date objects
      return item.timestamp instanceof Date && !isNaN(item.timestamp.getTime());
    })
    .map(item => {
      try {
        // Double-check validity before formatting
        if (!item.timestamp || !(item.timestamp instanceof Date) || isNaN(item.timestamp.getTime())) {
          return null;
        }
        return {
          date: format(item.timestamp, 'MMM dd'),
          volume: item.volume,
          trades: item.trades,
        };
      } catch (error) {
        console.warn('Invalid timestamp in chart data:', item.timestamp, error);
        return null;
      }
    })
    .filter(item => item !== null) as Array<{ date: string; volume: number; trades: number }>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis tickFormatter={(value) => numeral(value).format('0.0a')} />
        <Tooltip
          formatter={(value, name) => [
            typeof value === 'number'
              ? (name === 'volume' ? numeral(value).format('$0,0.00') : value)
              : '0',
            name === 'volume' ? 'Volume' : 'Trades',
          ]}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="volume"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          name="Volume"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
