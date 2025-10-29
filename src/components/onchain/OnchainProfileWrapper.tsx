import { GlobalSuiProvider } from "../providers/GlobalSuiProvider.tsx";
import OnchainProfile from "./OnchainProfile.tsx";

interface OnchainProfileWrapperProps {
  username: string;
  showEditButton?: boolean;
}

/**
 * Wrapper component for OnchainProfile that provides WalletProvider context
 * This is necessary because OnchainProfile is hydrated separately with client:only
 */
function OnchainProfileWrapper({ username, showEditButton }: OnchainProfileWrapperProps) {
  return (
    <GlobalSuiProvider>
      <OnchainProfile username={username} showEditButton={showEditButton} />
    </GlobalSuiProvider>
  );
}

export default OnchainProfileWrapper;

