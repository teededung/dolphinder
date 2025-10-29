import { GlobalSuiProvider } from "../providers/GlobalSuiProvider";
import WalrusStorageInfo from "./WalrusStorageInfo";
import type { WalrusBlobMetadata } from "../../lib/walrus-metadata";
import type { Developer } from "../../lib/auth";

interface WalrusStorageInfoWrapperProps {
  blobMetadata: WalrusBlobMetadata;
  devId: string;
  walrusBlobId: string;
  blobObjectId: string;
  developer: Developer;
}

/**
 * Wrapper component for WalrusStorageInfo that provides WalletProvider context
 * This is necessary because WalrusStorageInfo (and CompareWalrusModal inside it)
 * uses wallet hooks and is hydrated separately with client:load
 */
export default function WalrusStorageInfoWrapper(props: WalrusStorageInfoWrapperProps) {
  return (
    <GlobalSuiProvider>
      <WalrusStorageInfo {...props} />
    </GlobalSuiProvider>
  );
}

