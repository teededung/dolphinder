import { GlobalSuiProvider } from "./providers/GlobalSuiProvider";
import Header from "./shared/Header";
import Footer from "./shared/Footer";
import DialogStored from "./shared/DialogStored";
import ScrollToTop from "./shared/ScrollToTop";

interface AppProps {
  children?: React.ReactNode;
}

/**
 * App wrapper component that provides global context to all child components
 * 
 * Architecture:
 * - Wrapped by MainLayout.astro with client:only="react" directive
 * - This ensures React hydration happens client-side only (no SSR)
 * - GlobalSuiProvider wraps all components to provide:
 *   1. Sui blockchain client
 *   2. Wallet connection with autoConnect
 *   3. React Query client (singleton)
 *   4. Wallet state persistence
 *   5. Error boundary for graceful error handling
 * 
 * Provider Hierarchy:
 * App (client:only)
 *  └── GlobalSuiProvider
 *      ├── WalletErrorBoundary
 *      ├── QueryClientProvider (singleton)
 *      ├── SuiClientProvider
 *      ├── WalletProvider (autoConnect)
 *      └── WalletPersistenceManager
 *          └── children (Header, pages, Footer, etc.)
 * 
 * Benefits:
 * - Single hydration boundary prevents hydration mismatches
 * - Singleton QueryClient prevents state loss on re-renders
 * - Wallet state persists across page refreshes
 * - All components can use wallet hooks from @mysten/dapp-kit
 */
export default function App({ children }: AppProps) {
  return (
    <GlobalSuiProvider>
      <Header />
      <main>{children}</main>
      <Footer />
      <DialogStored />
      <ScrollToTop />
    </GlobalSuiProvider>
  );
}
