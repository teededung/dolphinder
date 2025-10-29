import { GlobalSuiProvider } from "../providers/GlobalSuiProvider";
import ProfileForm from "./ProfileForm";
import type { Developer } from "../../lib/auth";

interface ProfileFormWrapperProps {
  developer: Developer;
}

/**
 * Wrapper component for ProfileForm that provides its own WalletProvider context
 * This is necessary because ProfileForm is hydrated separately from the main App component
 */
export default function ProfileFormWrapper({ developer }: ProfileFormWrapperProps) {
  return (
    <GlobalSuiProvider>
      <ProfileForm developer={developer} />
    </GlobalSuiProvider>
  );
}

