/**
 * Wagmi and RainbowKit Configuration
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, arbitrum, optimism, base, polygon } from 'wagmi/chains';

// Create Wagmi config with RainbowKit
export const wagmiConfig = getDefaultConfig({
  appName: 'SeedX Trade Analytics',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'ddf4f01dac3f7c3956dec722bc70776f',
  chains: [mainnet, arbitrum, optimism, base, polygon],
  ssr: false,
});

export const chains = [mainnet, arbitrum, optimism, base, polygon];
