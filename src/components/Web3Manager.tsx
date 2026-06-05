/**
 * Web3 Manager Component
 * 
 * Handles wallet connection, network validation, and display.
 * Uses Wagmi and RainbowKit for wallet integration.
 */

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { AlertTriangle } from 'lucide-react';
import { useSetWallet } from '../store';

const SUPPORTED_CHAINS = [1, 42161, 10, 8453, 137]; // Ethereum, Arbitrum, Optimism, Base, Polygon

export const Web3Manager: React.FC = () => {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const setWallet = useSetWallet();

  // Update wallet state in store
  React.useEffect(() => {
    setWallet({
      address: address || null,
      chainId: chainId || null,
      isConnected,
      connector: connector || null,
    });
  }, [address, chainId, isConnected, connector, setWallet]);

  const isUnsupportedNetwork = chainId && !SUPPORTED_CHAINS.includes(chainId);

  return (
    <div className="flex items-center gap-4">
      {isUnsupportedNetwork && (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">Unsupported Network</span>
        </div>
      )}
      
      <ConnectButton />
    </div>
  );
};
