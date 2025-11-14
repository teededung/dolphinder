import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";
import { WalletErrorBoundary } from "./WalletErrorBoundary";
import { WalletPersistenceManager } from "./WalletPersistenceManager";

// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});

/**
 * Singleton QueryClient instance
 * 
 * Created outside component scope to prevent recreation on re-renders.
 * This ensures wallet state and query cache persist across component updates.
 * 
 * Configuration:
 * - staleTime: 5 minutes - data considered fresh for 5 minutes
 * - gcTime: 10 minutes - cache retained for 10 minutes after last use
 * - retry: 2 - retry failed queries twice before giving up
 * - refetchOnWindowFocus: false - don't refetch when window regains focus
 * - refetchOnReconnect: true - refetch when network reconnects
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

interface GlobalSuiProviderProps {
  children: React.ReactNode;
}

/**
 * GlobalSuiProvider
 * 
 * Single source of truth for Sui/Wallet context across the entire application.
 * 
 * Provider Hierarchy:
 * 1. WalletErrorBoundary - Catches and handles provider errors
 * 2. QueryClientProvider - Provides React Query client (singleton)
 * 3. SuiClientProvider - Provides Sui blockchain client
 * 4. WalletProvider - Provides wallet connection (with autoConnect)
 * 5. WalletPersistenceManager - Manages wallet state persistence
 * 
 * Features:
 * - Singleton QueryClient prevents state loss on re-renders
 * - Error boundary provides graceful error handling
 * - Wallet persistence enables connection across page refreshes
 * - Optimized cache settings reduce unnecessary API calls
 * 
 * Usage:
 * Wrap your app root with this provider in App.tsx.
 * All child components can use wallet hooks from @mysten/dapp-kit.
 */
export function GlobalSuiProvider({ children }: GlobalSuiProviderProps) {
  return (
    <WalletErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider autoConnect>
            <WalletPersistenceManager>
              {children}
            </WalletPersistenceManager>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </WalletErrorBoundary>
  );
}
