/**
 * Wallet Analytics Service
 * 
 * Analyzes trading activity by wallet addresses (maker/taker)
 */

import type { TradeRecord } from '../types/trade';

export interface WalletMetrics {
  walletAddress: string;
  buyQty: number;
  sellQty: number;
  totalVolume: number;
  avgBuyRate: number;
  avgSellRate: number;
  buyUsdt: number;
  sellUsdt: number;
  estimatedPnl: number;
  tradeCount: number;
}

export interface WalletAnalyticsResults {
  uniqueWallets: number;
  totalVolume: number;
  totalVolumeQty: number; // DSC quantity
  totalTrades: number;
  lastTurnover: number;
  buySellRatio: number;
  walletMetrics: WalletMetrics[];
}

/**
 * Computes wallet-based analytics from trade records
 */
export function computeWalletAnalytics(records: TradeRecord[]): WalletAnalyticsResults {
  if (records.length === 0) {
    return {
      uniqueWallets: 0,
      totalVolume: 0,
      totalVolumeQty: 0,
      totalTrades: 0,
      lastTurnover: 0,
      buySellRatio: 0,
      walletMetrics: [],
    };
  }

  const walletMap = new Map<string, {
    buyQty: number;
    sellQty: number;
    buyValue: number;
    sellValue: number;
    buyCount: number;
    sellCount: number;
    buyPrices: number[];
    sellPrices: number[];
  }>();

  let totalVolume = 0;
  let totalBuyQty = 0;
  let totalSellQty = 0;
  let totalVolumeQty = 0; // Track DSC quantity

  // Process each trade
  for (const record of records) {
    // Get both maker and taker wallets
    const wallets = [record.maker_user_id, record.taker_user_id].filter(w => w && w.trim());

    for (const wallet of wallets) {
      if (!walletMap.has(wallet)) {
        walletMap.set(wallet, {
          buyQty: 0,
          sellQty: 0,
          buyValue: 0,
          sellValue: 0,
          buyCount: 0,
          sellCount: 0,
          buyPrices: [],
          sellPrices: [],
        });
      }

      const metrics = walletMap.get(wallet)!;

      if (record.side === 'buy') {
        metrics.buyQty += record.quantity;
        metrics.buyValue += record.quote_quantity;
        metrics.buyCount++;
        metrics.buyPrices.push(record.price);
        totalBuyQty += record.quantity;
      } else {
        metrics.sellQty += record.quantity;
        metrics.sellValue += record.quote_quantity;
        metrics.sellCount++;
        metrics.sellPrices.push(record.price);
        totalSellQty += record.quantity;
      }
    }

    totalVolume += record.quote_quantity;
    totalVolumeQty += record.quantity;
  }

  // Convert to WalletMetrics array
  const walletMetrics: WalletMetrics[] = Array.from(walletMap.entries())
    .map(([address, data]) => {
      const avgBuyRate = data.buyPrices.length > 0
        ? data.buyPrices.reduce((sum, p) => sum + p, 0) / data.buyPrices.length
        : 0;

      const avgSellRate = data.sellPrices.length > 0
        ? data.sellPrices.reduce((sum, p) => sum + p, 0) / data.sellPrices.length
        : 0;

      // Estimated P&L = (Avg Sell Price - Avg Buy Price) * Min(Buy Qty, Sell Qty)
      const realizedQty = Math.min(data.buyQty, data.sellQty);
      const estimatedPnl = (avgSellRate - avgBuyRate) * realizedQty;

      return {
        walletAddress: address,
        buyQty: data.buyQty,
        sellQty: data.sellQty,
        totalVolume: data.buyValue + data.sellValue,
        avgBuyRate,
        avgSellRate,
        buyUsdt: data.buyValue,
        sellUsdt: data.sellValue,
        estimatedPnl,
        tradeCount: data.buyCount + data.sellCount,
      };
    })
    .sort((a, b) => b.totalVolume - a.totalVolume); // Sort by volume

  // Calculate buy/sell ratio
  const buySellRatio = totalSellQty > 0 ? totalBuyQty / totalSellQty : 0;

  // Last turnover (most recent trade value)
  const lastTurnover = records.length > 0 ? (records[records.length - 1]?.quote_quantity || 0) : 0;

  return {
    uniqueWallets: walletMap.size,
    totalVolume,
    totalVolumeQty,
    totalTrades: records.length,
    lastTurnover,
    buySellRatio,
    walletMetrics,
  };
}
