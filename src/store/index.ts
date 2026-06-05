/**
 * Global Application State Store
 * 
 * Zustand store for trade data, analytics, filters, and UI state.
 * Uses immer middleware for immutable updates and persist middleware
 * for filter state persistence.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TradeRecord } from '../types/trade';
import type { TradeDataStore } from '../types';
import type { AnalyticsResults, TimePeriod } from '../types/analytics';
import type { FilterCriteria } from '../types/filters';
import { buildDataStore } from '../utils/dataStore';
import {
  computeOverallMetrics,
  computeVolumeByPair,
  computeVolumeByChain,
  computeTimeSeries,
  computeFeeMetrics,
  computeLiquidationMetrics,
  computeFailureMetrics,
} from '../services/analytics';
import { computeWalletAnalytics, type WalletAnalyticsResults } from '../services/walletAnalytics';
import { applyFilters, clearFilters as resetFilters } from '../services/filterManager';

/**
 * Wallet state interface
 */
export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  connector: any | null;
}

/**
 * Application state interface
 */
interface AppState {
  // Raw data
  tradeRecords: TradeRecord[];
  dataStore: TradeDataStore | null;
  
  // Computed analytics
  analytics: AnalyticsResults | null;
  walletAnalytics: WalletAnalyticsResults | null;
  isAnalyticsLoading: boolean;
  
  // Filters
  filters: FilterCriteria;
  filteredRecords: TradeRecord[];
  
  // UI state
  selectedTrade: TradeRecord | null;
  chartTimePeriod: TimePeriod;
  tablePageSize: number;
  
  // Web3
  wallet: WalletState;
  
  // CSV load metadata
  lastLoadedFile: string | null;
  lastLoadTimestamp: string | null;
  
  // Actions
  loadTradeData: (records: TradeRecord[]) => void;
  computeAnalytics: () => void;
  updateFilter: <K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => void;
  clearFilters: () => void;
  setSelectedTrade: (trade: TradeRecord | null) => void;
  setChartTimePeriod: (period: TimePeriod) => void;
  setTablePageSize: (size: number) => void;
  setWallet: (wallet: Partial<WalletState>) => void;
  setLastLoadedFile: (fileName: string) => void;
}

/**
 * Initial state values
 */
const initialWallet: WalletState = {
  address: null,
  chainId: null,
  isConnected: false,
  connector: null,
};

/**
 * Create Zustand store with immer and persist middleware
 * 
 * Validates: Requirements 2.9, 4.6, 4.7, 10.1, 10.2
 */
export const useAppStore = create<AppState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      tradeRecords: [],
      dataStore: null,
      analytics: null,
      walletAnalytics: null,
      isAnalyticsLoading: false,
      filters: resetFilters(),
      filteredRecords: [],
      selectedTrade: null,
      chartTimePeriod: 'daily',
      tablePageSize: 100, // Increased from 50 for better performance
      wallet: initialWallet,
      lastLoadedFile: null,
      lastLoadTimestamp: null,

      // Load trade data and trigger analytics computation
      loadTradeData: (records: TradeRecord[]) => {
        console.log('%c[Store] loadTradeData called', 'color: blue; font-weight: bold', 'Records:', records.length);
        console.log('%c[Store] First record:', 'color: gray', records[0]);
        
        set(state => {
          state.tradeRecords = records;
          state.dataStore = buildDataStore(records);
          state.filteredRecords = records;
          state.isAnalyticsLoading = true;
        });

        console.log('%c[Store] State updated, scheduling analytics computation...', 'color: blue');

        // Compute analytics immediately for better responsiveness
        // Small delay to let UI update
        setTimeout(() => {
          console.log('%c[Analytics] Starting computation...', 'color: green; font-weight: bold');
          try {
            get().computeAnalytics();
          } catch (error) {
            console.error('%c[Analytics] Computation failed:', 'color: red; font-weight: bold', error);
            set(state => {
              state.isAnalyticsLoading = false;
            });
          }
        }, 50);
      },

      // Compute analytics from current filtered records
      computeAnalytics: () => {
        const { filteredRecords } = get();
        console.log('%c[Analytics] computeAnalytics called', 'color: green; font-weight: bold', 'Records:', filteredRecords.length);

        set(state => {
          state.isAnalyticsLoading = true;
        });

        // Perform analytics computation
        const startTime = Date.now();
        
        // For very large datasets, sample for faster computation
        const shouldSample = filteredRecords.length > 50000;
        const records = shouldSample
          ? filteredRecords.filter((_, i) => i % Math.ceil(filteredRecords.length / 50000) === 0)
          : filteredRecords;
        
        if (shouldSample) {
          console.log('%c[Analytics] Sampling data', 'color: orange', 'Original:', filteredRecords.length, 'Sampled:', records.length);
        }
        
        console.log('[Analytics] Computing overall metrics...');
        const overall = computeOverallMetrics(records);
        console.log('[Analytics] ✓ Overall metrics computed in', Date.now() - startTime, 'ms');
        
        console.log('[Analytics] Computing pair metrics...');
        const byPair = computeVolumeByPair(records);
        console.log('[Analytics] ✓ Pair metrics computed');
        
        console.log('[Analytics] Computing chain metrics...');
        const byChain = computeVolumeByChain(records);
        console.log('[Analytics] ✓ Chain metrics computed');
        
        console.log('[Analytics] Computing time series...');
        const timePeriod = get().chartTimePeriod;
        const timeSeries = computeTimeSeries(records, timePeriod);
        console.log('[Analytics] ✓ Time series computed');
        
        console.log('[Analytics] Computing fees, liquidations, failures...');
        const fees = computeFeeMetrics(records);
        const liquidations = computeLiquidationMetrics(records);
        const failures = computeFailureMetrics(records);
        
        console.log('[Analytics] Computing wallet analytics...');
        const walletAnalytics = computeWalletAnalytics(records);

        const totalTime = Date.now() - startTime;
        console.log('%c[Analytics] ✓ All analytics computed!', 'color: green; font-weight: bold', 'Total time:', totalTime, 'ms');

        set(state => {
          state.analytics = {
            overall,
            byPair,
            byChain,
            timeSeries,
            fees,
            liquidations,
            failures,
          };
          state.walletAnalytics = walletAnalytics;
          state.isAnalyticsLoading = false;
        });
        
        console.log('%c[Analytics] ✓ State updated - UI should now display data', 'color: green; font-weight: bold');
      },

      // Update a specific filter and recompute analytics
      updateFilter: <K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => {
        set(state => {
          state.filters[key] = value;
          
          // Apply filters to get updated filtered records
          state.filteredRecords = applyFilters(state.tradeRecords, state.filters);
        });

        // Recompute analytics with new filtered data
        get().computeAnalytics();
      },

      // Clear all filters
      clearFilters: () => {
        set(state => {
          state.filters = resetFilters();
          state.filteredRecords = state.tradeRecords;
        });

        // Recompute analytics
        get().computeAnalytics();
      },

      // UI state setters
      setSelectedTrade: (trade: TradeRecord | null) => {
        set(state => {
          state.selectedTrade = trade;
        });
      },

      setChartTimePeriod: (period: TimePeriod) => {
        set(state => {
          state.chartTimePeriod = period;
        });

        // Recompute time series with new period
        get().computeAnalytics();
      },

      setTablePageSize: (size: number) => {
        set(state => {
          state.tablePageSize = size;
        });
      },

      setWallet: (walletUpdate: Partial<WalletState>) => {
        set(state => {
          state.wallet = { ...state.wallet, ...walletUpdate };
        });
      },

      setLastLoadedFile: (fileName: string) => {
        set(state => {
          state.lastLoadedFile = fileName;
          state.lastLoadTimestamp = new Date().toISOString();
        });
      },
    })),
    {
      name: 'seedx-trade-analytics-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist filters, UI preferences, and CSV load metadata
      partialize: (state) => ({
        filters: state.filters,
        chartTimePeriod: state.chartTimePeriod,
        tablePageSize: state.tablePageSize,
        lastLoadedFile: state.lastLoadedFile,
        lastLoadTimestamp: state.lastLoadTimestamp,
      }),
    }
  )
);

/**
 * Selector hooks for optimized component subscriptions
 */

// Analytics selectors
export const useAnalytics = () => useAppStore(state => state.analytics);
export const useWalletAnalytics = () => useAppStore(state => state.walletAnalytics);
export const useIsAnalyticsLoading = () => useAppStore(state => state.isAnalyticsLoading);

// Data selectors
export const useTradeRecords = () => useAppStore(state => state.tradeRecords);
export const useFilteredRecords = () => useAppStore(state => state.filteredRecords);
export const useDataStore = () => useAppStore(state => state.dataStore);

// Filter selectors
export const useFilters = () => useAppStore(state => state.filters);

// UI selectors
export const useSelectedTrade = () => useAppStore(state => state.selectedTrade);
export const useChartTimePeriod = () => useAppStore(state => state.chartTimePeriod);
export const useTablePageSize = () => useAppStore(state => state.tablePageSize);

// Wallet selectors
export const useWallet = () => useAppStore(state => state.wallet);

// CSV load metadata selectors
export const useLastLoadedFile = () => useAppStore(state => state.lastLoadedFile);
export const useLastLoadTimestamp = () => useAppStore(state => state.lastLoadTimestamp);

// Action selectors
export const useLoadTradeData = () => useAppStore(state => state.loadTradeData);
export const useComputeAnalytics = () => useAppStore(state => state.computeAnalytics);
export const useUpdateFilter = () => useAppStore(state => state.updateFilter);
export const useClearFilters = () => useAppStore(state => state.clearFilters);
export const useSetSelectedTrade = () => useAppStore(state => state.setSelectedTrade);
export const useSetChartTimePeriod = () => useAppStore(state => state.setChartTimePeriod);
export const useSetTablePageSize = () => useAppStore(state => state.setTablePageSize);
export const useSetWallet = () => useAppStore(state => state.setWallet);
export const useSetLastLoadedFile = () => useAppStore(state => state.setLastLoadedFile);
