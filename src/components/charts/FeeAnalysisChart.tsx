/**
 * Fee Analysis Area Chart
 * 
 * Shows total fees paid over time.
 */

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import numeral from 'numeral';
import type { FeeMetrics } from '../../types/analytics';

interface FeeAnalysisChartProps {
  data: FeeMetrics;
  height?: number;
}

export const FeeAnalysisChart: React.FC<FeeAnalysisChartProps> = ({
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

  // Show fee summary even if no time series data
  const hasTimeData = data.feesOverTime.length > 0;

  // If no time series data, show summary stats
  if (!hasTimeData || data.feesOverTime.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6" style={{ height }}>
        <div className="text-center space-y-4">
          <div className="text-4xl font-bold text-gray-900">
            {numeral(data.totalFees).format('$0,0.00')}
          </div>
          <div className="text-sm text-gray-600">Total Fees</div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-lg font-semibold text-green-700">
                {numeral(data.totalMakerFees).format('$0,0.00')}
              </div>
              <div className="text-xs text-green-600">Maker Fees</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-lg font-semibold text-blue-700">
                {numeral(data.totalTakerFees).format('$0,0.00')}
              </div>
              <div className="text-xs text-blue-600">Taker Fees</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Avg: {numeral(data.avgFeePerTrade).format('$0,0.0000')} per trade
          </div>
        </div>
      </div>
    );
  }

  // Sort and format data - filter invalid dates first
  const chartData = [...data.feesOverTime]
    .filter(item => {
      // Only include items with valid Date objects
      return item.timestamp instanceof Date && !isNaN(item.timestamp.getTime());
    })
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map(item => {
      try {
        // Double-check validity before formatting
        if (!item.timestamp || !(item.timestamp instanceof Date) || isNaN(item.timestamp.getTime())) {
          return null;
        }
        return {
          date: format(item.timestamp, 'MMM dd'),
          amount: item.amount || 0,
        };
      } catch (error) {
        console.warn('Invalid timestamp in fee data:', item.timestamp, error);
        return null;
      }
    })
    .filter(item => item !== null) as Array<{ date: string; amount: number }>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis tickFormatter={(value) => numeral(value).format('0.0a')} />
        <Tooltip formatter={(value) => typeof value === 'number' ? numeral(value).format('$0,0.00') : '0'} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorFees)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
