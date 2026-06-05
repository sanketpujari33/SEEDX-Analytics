# SeedX Trade Analytics Dashboard

A high-performance Web3-enabled React application for analyzing trading data from decentralized exchanges. Handles 156,000+ trade records with real-time analytics, interactive visualizations, and blockchain wallet integration.

## 🚀 Features

### Core Functionality
- **CSV Data Processing**: Stream-parse large CSV files (up to 200k records) with progress tracking and error reporting
- **Real-time Analytics**: Compute trading volume, fees, liquidations, and trends across multiple dimensions
- **Interactive Visualizations**: 6 responsive chart types with Recharts (Volume over time, Pair distribution, Buy/Sell comparison, Fee analysis, Liquidations)
- **Advanced Filtering**: Filter by date range, trading pairs, chains, side, liquidations, and failed transactions
- **Transaction Details**: Searchable, sortable virtualized table with row expansion and blockchain explorer links
- **Web3 Integration**: Connect wallet with RainbowKit supporting Ethereum, Arbitrum, Optimism, Base, and Polygon
- **Data Export**: Export filtered data to CSV or analytics reports to JSON
- **Persistent State**: Filter preferences and UI settings saved to localStorage

### Technical Highlights
- ⚡ **Sub-5-second analytics** computation for 200k records
- 📊 **Virtualized table rendering** for smooth 60 FPS scrolling
- 🔄 **Lazy-loaded chart components** with code splitting
- 💾 **Optimized data structures** with Map-based indices for O(1) lookups
- 🎨 **Responsive design** from mobile (320px) to desktop (2560px+)
- ♿ **Accessible** with ARIA labels, keyboard navigation, and screen reader support

## 📦 Tech Stack

- **React 18.3+** with TypeScript 5.x
- **Vite 5.x** for fast builds and HMR
- **Zustand** for state management (with persist middleware)
- **Recharts** for data visualization
- **TanStack Table** for virtualized data tables
- **Wagmi + RainbowKit** for Web3 wallet integration
- **PapaParse** for CSV parsing with Web Worker support
- **Tailwind CSS** for styling
- **date-fns** for date manipulation
- **numeral** for number formatting

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Quick Start

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open the app** at `http://localhost:5173`

3. **Load sample data**:
   - Use the drag-and-drop area to upload `public/sample-data.csv`
   - Or create your own CSV with the required format (see below)

4. **Explore analytics**:
   - View summary metrics and charts
   - Apply filters to drill down into specific trades
   - Expand table rows for detailed transaction information
   - Connect your Web3 wallet (optional)

## 📋 CSV Format

Your CSV file should include the following columns:

### Required Fields
- `id`: Unique record identifier
- `trade_number`: Human-readable trade number
- `pair_id`: Trading pair (e.g., "ETH/USDC")
- `chain_id`: Blockchain chain ID (1 for Ethereum, 42161 for Arbitrum, etc.)
- `side`: "buy" or "sell"
- `price`: Execution price (number)
- `quantity`: Base asset quantity (number)
- `quote_quantity`: Quote asset value (number)
- `created_at`: ISO 8601 timestamp when order created
- `executed_at`: ISO 8601 timestamp when trade executed

### Optional Fields
- `chain_name`: Human-readable chain name
- `maker_user_id`: User ID of maker
- `taker_user_id`: User ID of taker
- `maker_fee`: Fee paid by maker
- `taker_fee`: Fee paid by taker
- `fee_asset`: Token used for fees
- `tx_hash`: Transaction hash
- `block_number`: Block number
- `is_liquidation`: Boolean flag
- `metadata`: JSON string with transaction details

### Example CSV Row
```csv
id,trade_number,pair_id,chain_id,side,price,quantity,quote_quantity,created_at,executed_at
1,TRD001,ETH/USDC,1,buy,2000.50,1.5,3000.75,2024-01-01T00:00:00Z,2024-01-01T00:00:01Z
```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── charts/          # Chart components (6 types)
│   ├── CSVLoader.tsx    # File upload & parsing UI
│   ├── Dashboard.tsx    # Main layout
│   ├── FilterPanel.tsx  # Filter controls
│   ├── TradeTable.tsx   # Virtualized data table
│   └── Web3Manager.tsx  # Wallet connection
├── services/            # Business logic
│   ├── analytics.ts     # Analytics computation functions
│   ├── csvParser.ts     # CSV parsing service
│   ├── filterManager.ts # Filter application logic
│   └── csvParser.worker.ts # Web Worker for parsing
├── store/               # State management
│   └── index.ts         # Zustand store configuration
├── types/               # TypeScript type definitions
│   ├── trade.ts         # Trade record types
│   ├── analytics.ts     # Analytics result types
│   └── filters.ts       # Filter criteria types
├── utils/               # Utility functions
│   ├── dataStore.ts     # Optimized data indexing
│   └── exportUtils.ts   # CSV/JSON export functions
├── config/              # Configuration
│   └── wagmi.ts         # Web3 wallet configuration
├── App.tsx              # Application entry point
└── main.tsx             # React DOM render
```

## 📊 Analytics Computed

### Overall Metrics
- Total trading volume
- Total trades (buy/sell breakdown)
- Average trade size and value
- Liquidation rate
- Failed transaction rate

### Dimensional Analytics
- **By Trading Pair**: Volume, trade count, average price, price range
- **By Blockchain**: Volume, trade count, average fees
- **Over Time**: Daily/weekly/monthly volume and trade counts
- **Fee Analysis**: Maker/taker fees, fees by asset, fees over time
- **Liquidations**: Count, volume, size, distribution by pair
- **Failures**: Count, rate, reasons, rollbacks, gas consumption

## 🎨 Customization

### Adding New Chart Types
1. Create component in `src/components/charts/`
2. Import and add to Dashboard layout
3. Wrap with `ChartErrorBoundary` and `Suspense`

### Modifying Analytics
1. Add computation function to `src/services/analytics.ts`
2. Update `AnalyticsResults` type in `src/types/analytics.ts`
3. Call function in `computeAnalytics` action in Zustand store

### Extending Filters
1. Add filter field to `FilterCriteria` in `src/types/filters.ts`
2. Update `applyFilters` logic in `src/services/filterManager.ts`
3. Add UI control in `src/components/FilterPanel.tsx`

## 🔧 Configuration

### Web3 Wallet
Update `src/config/wagmi.ts` to customize:
- Supported blockchain networks
- Wallet providers
- WalletConnect Project ID

### Performance Tuning
Adjust constants in relevant files:
- **CSV chunk size**: `csvParser.ts` (default: 1000 rows)
- **Chart data points limit**: `analytics.ts` (default: 1000 points)
- **Table page size**: User-configurable (25/50/100)
- **Error collection limit**: `csvParser.ts` (default: 100 errors)

## 📈 Performance Benchmarks

- **CSV Parsing**: 200k records in <5 seconds
- **Analytics Computation**: <5 seconds for 200k records
- **Chart Rendering**: <2 seconds
- **Table Scrolling**: 60 FPS with virtualization
- **Initial Load**: <3 seconds on broadband

## 🐛 Known Limitations

1. **CSV File Size**: Maximum 100MB (browser memory constraints)
2. **Metadata Parsing**: Complex nested JSON may not display fully
3. **Web3 Networks**: Limited to configured chains (Ethereum, Arbitrum, Optimism, Base, Polygon)
4. **Export Size**: Very large datasets (>100k records) may take time to export

## 🤝 Contributing

This is a production-ready analytics dashboard. For feature requests or bug reports, please provide:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser/OS information
4. Sample CSV data (if applicable)

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built with modern Web3 and data visualization technologies:
- Recharts for beautiful, responsive charts
- TanStack Table for high-performance data tables
- RainbowKit for seamless wallet connection UX
- PapaParse for robust CSV processing
- Tailwind CSS for rapid UI development

---

**Built with ❤️ for the SeedX trading community**
