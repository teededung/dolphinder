import { useEffect, useState, useRef } from "react";
import { useCurrentAccount, useWallets, useConnectWallet } from "@mysten/dapp-kit";

interface WalletState {
  address: string | null;
  connected: boolean;
  lastConnected: number;
}

const STORAGE_KEY = "dolphinder_wallet_state";
const STATE_EXPIRY = 1000 * 60 * 60 * 24 * 7; // 7 days

const ERROR_MESSAGES = {
  STORAGE_UNAVAILABLE:
    "Browser storage is unavailable. Wallet connection will not persist across sessions.",
  STATE_CORRUPTED: "Wallet state corrupted. Clearing and starting fresh.",
};

/**
 * WalletPersistenceManager
 * 
 * Manages wallet connection state persistence across page refreshes.
 * 
 * Features:
 * - Persists wallet address to localStorage on connection
 * - Restores wallet state on mount (after hydration)
 * - Clears state on disconnection
 * - Handles expired state (7 days)
 * - Gracefully handles localStorage unavailable scenarios
 * - Shows loading state during restoration
 */
export function WalletPersistenceManager({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  const { mutate: connectWallet } = useConnectWallet();
  const [isRestoring, setIsRestoring] = useState(true);
  const hasRestoredRef = useRef(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const reconnectAttemptedRef = useRef(false);

  // Check if localStorage is available
  const isLocalStorageAvailable = (): boolean => {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Persist wallet state when it changes (with debounce to avoid clearing during reconnect)
  useEffect(() => {
    if (!storageAvailable) return;

    // Debounce to avoid clearing state during transient disconnects (e.g., during reconnect)
    const timeoutId = setTimeout(() => {
      try {
        if (currentAccount?.address) {
          const state: WalletState = {
            address: currentAccount.address,
            connected: true,
            lastConnected: Date.now(),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          // State persisted silently
        } else if (!isRestoring) {
          // Only clear state if we're not in the middle of restoring
          // This prevents clearing state during the reconnect process
          localStorage.removeItem(STORAGE_KEY);
          // State cleared silently
        }
      } catch (error) {
        console.error("[WalletPersistence] Failed to persist state:", error);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [currentAccount, storageAvailable, isRestoring]);

  // Restore wallet state on mount (after hydration)
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const restoreState = () => {
      // Check localStorage availability
      if (!isLocalStorageAvailable()) {
        console.warn(
          "[WalletPersistence]",
          ERROR_MESSAGES.STORAGE_UNAVAILABLE
        );
        setStorageAvailable(false);
        setIsRestoring(false);
        return;
      }

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          setIsRestoring(false);
          return;
        }

        const state: WalletState = JSON.parse(stored);

        // Validate state structure
        if (
          !state.address ||
          typeof state.connected !== "boolean" ||
          typeof state.lastConnected !== "number"
        ) {
          console.warn(
            "[WalletPersistence]",
            ERROR_MESSAGES.STATE_CORRUPTED
          );
          localStorage.removeItem(STORAGE_KEY);
          setIsRestoring(false);
          return;
        }

        // Check if state is expired
        if (Date.now() - state.lastConnected > STATE_EXPIRY) {
          console.log(
            "[WalletPersistence] State expired (older than 7 days), clearing"
          );
          localStorage.removeItem(STORAGE_KEY);
          setIsRestoring(false);
          return;
        }

        // Restoring state silently

        // WalletProvider's autoConnect will handle reconnection
        // Set a maximum timeout of 2 seconds in case autoConnect fails
        // This is a reasonable time - if wallet doesn't reconnect by then, it likely won't
        const maxTimeout = setTimeout(() => {
          setIsRestoring(false);
        }, 2000);

        // Store timeout ID for cleanup
        (window as any).__walletRestoreTimeout = maxTimeout;
      } catch (error) {
        console.error("[WalletPersistence] Failed to restore state:", error);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
          // Ignore cleanup errors
        }
        setIsRestoring(false);
      }
    };

    // Defer restoration until after hydration
    if (typeof window !== "undefined") {
      setTimeout(restoreState, 100);
    } else {
      setIsRestoring(false);
    }
  }, []);

  // Monitor currentAccount to detect when wallet reconnects
  useEffect(() => {
    if (currentAccount && isRestoring) {
      // Clear the timeout if wallet reconnects before timeout
      if ((window as any).__walletRestoreTimeout) {
        clearTimeout((window as any).__walletRestoreTimeout);
        delete (window as any).__walletRestoreTimeout;
      }
      
      setIsRestoring(false);
    }
  }, [currentAccount, isRestoring]);

  // Actively reconnect wallet if autoConnect fails
  useEffect(() => {
    // Only attempt reconnect once, after wallets are loaded, and if not already connected
    if (
      reconnectAttemptedRef.current ||
      !isRestoring ||
      currentAccount ||
      wallets.length === 0
    ) {
      return;
    }

    // Check if we have stored state
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const state: WalletState = JSON.parse(stored);
      if (!state.address || !state.connected) return;

      // Mark that we've attempted reconnect
      reconnectAttemptedRef.current = true;

      // Add delay to ensure wallet extension is fully ready
      setTimeout(() => {
        // Try to find the last connected wallet
        // Most wallet extensions store their own state, so we try the first available wallet
        const lastWallet = wallets[0];
        
        if (lastWallet) {
          connectWallet(
            { wallet: lastWallet },
            {
              onSuccess: () => {
                // Manual reconnect successful
              },
              onError: (error) => {
                console.warn("[WalletPersistence] Reconnect failed:", error);
              },
            }
          );
        }
      }, 500); // Wait 500ms for wallet extension to be fully ready
    } catch (error) {
      console.error("[WalletPersistence] Failed to parse stored state:", error);
    }
  }, [wallets, isRestoring, currentAccount, connectWallet]);

  return (
    <>
      {children}
      
      {/* Show loading toast in bottom-right corner during restoration */}
      {isRestoring && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 py-3 shadow-lg backdrop-blur-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
            <p className="text-sm text-blue-400">Restoring wallet...</p>
          </div>
        </div>
      )}

      {/* Show warning toast if localStorage is unavailable */}
      {!storageAvailable && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="rounded-lg border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 shadow-lg backdrop-blur-sm">
            <p className="text-sm text-yellow-400">
              ⚠️ Wallet won't persist (storage unavailable)
            </p>
          </div>
        </div>
      )}
    </>
  );
}
