import { GlobalSuiProvider } from "../providers/GlobalSuiProvider";
import { OnchainProfile } from "./OnchainProfile";

interface OnchainProfileWrapperProps {
  username: string;
  showEditButton?: boolean;
}

/**
 * Wrapper component for OnchainProfile that provides WalletProvider context
 * This is necessary because OnchainProfile is hydrated separately with client:only
 */
export default function OnchainProfileWrapper({ username, showEditButton }: OnchainProfileWrapperProps) {
  return (
    <GlobalSuiProvider>
      <OnchainProfile username={username} showEditButton={showEditButton} />
    </GlobalSuiProvider>
  );
}

