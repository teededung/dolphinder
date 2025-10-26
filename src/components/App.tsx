import { GlobalSuiProvider } from "./providers/GlobalSuiProvider";
import Header from "./shared/Header";
import DialogStored from "./shared/DialogStored";

interface AppProps {
  children?: React.ReactNode;
}

/**
 * App wrapper component that provides global context to all child components
 * This ensures all React components share the same hydration boundary and can access providers
 */
export default function App({ children }: AppProps) {
  return (
    <GlobalSuiProvider>
      <Header />
      <main>{children}</main>
      <DialogStored />
    </GlobalSuiProvider>
  );
}
