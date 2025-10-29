import { useState, useEffect, useRef, type FormEvent } from "react";
import { useCurrentAccount, useWallets, useConnectWallet, useDisconnectWallet, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Button } from "./Button";
import type { Developer } from "../../lib/auth";
import { useModalStore } from "../../store/useModalStore";
import { uploadJson } from "../../lib/walrus";
import { getDevIdByUsername } from "../../lib/sui-views";
import { makeRegisterTx, makeUpdateProfileTx } from "../../lib/sui-tx";

interface ProfileFormProps {
  developer: Developer;
}

export default function ProfileForm({ developer }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bindedWallet, setBindedWallet] = useState<string>(developer.slush_wallet || "");
  const [walrusLoading, setWalrusLoading] = useState(false);
  const [walrusError, setWalrusError] = useState("");
  const [walrusSuccess, setWalrusSuccess] = useState("");
  const [walrusStep, setWalrusStep] = useState("");
  const [enableWalrusPush, setEnableWalrusPush] = useState(false);
  
  const currentAccount = useCurrentAccount();
  const { open, close } = useModalStore();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction() as any;
  const pendingWalrusPushRef = useRef<FormData | null>(null);
  const isConnectingWalletRef = useRef(false);

  // Auto-retry Walrus push when wallet connects
  useEffect(() => {
    if (currentAccount && pendingWalrusPushRef.current && isConnectingWalletRef.current) {
      const formData = pendingWalrusPushRef.current;
      pendingWalrusPushRef.current = null;
      isConnectingWalletRef.current = false;
      close(); // Close the modal
      
      // Retry push
      setTimeout(() => {
        handleWalrusPush(formData);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount]);

  // Auto-save wallet address when changed
  async function handleWalletChange(newAddress: string) {
    setBindedWallet(newAddress);
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("slush_wallet", newAddress);

      const response = await fetch("/api/profile/update", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update wallet");
      }

      setSuccess(newAddress ? "Wallet bound successfully!" : "Wallet unbound successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      console.error("Wallet update error:", err);
      setError(err.message || "Failed to update wallet");
      // Revert the wallet state on error
      setBindedWallet(developer.slush_wallet || "");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      const response = await fetch("/api/profile/update", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");

      // If Walrus push is enabled, trigger it after successful profile update
      if (enableWalrusPush && bindedWallet) {
        await handleWalrusPush(formData);
      } else {
        // Reload page after 1 second to show updated profile
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile");
      setLoading(false);
    }
  }

  async function handleWalrusPush(formData: FormData) {
    try {
      setWalrusLoading(true);
      setWalrusError("");
      setWalrusSuccess("");
      setWalrusStep("");

      if (!currentAccount) {
        // Auto-open wallet connect modal if not connected
        setWalrusLoading(false);
        pendingWalrusPushRef.current = formData;
        isConnectingWalletRef.current = true;
        
        open({ 
          content: (
            <WalletConnectPrompt 
              onClose={() => {
                // User cancelled
                pendingWalrusPushRef.current = null;
                isConnectingWalletRef.current = false;
                close();
              }}
            />
          ) 
        });
        return;
      }

      // Step 1: Prepare data
      setWalrusStep("📦 Preparing profile data...");
      const profileData = {
        profile: {
          name: formData.get("name") as string,
          bio: (formData.get("bio") as string) || "",
          github: (formData.get("github") as string) || "",
          linkedin: (formData.get("linkedin") as string) || "",
          website: (formData.get("website") as string) || "",
          avatar: (formData.get("avatar") as string) || developer.avatar || "",
        },
        projects: [],
        certificates: [],
      };

      // Step 2: Upload to Walrus
      setWalrusStep("🐋 Uploading to Walrus storage...");
      const { blobId, blobObjectId } = await uploadJson(profileData);

      // Step 3: Create transaction
      setWalrusStep("⚙️ Creating blockchain transaction...");
      const devId = await getDevIdByUsername(developer.username);
      const sender = currentAccount.address;
      let txForWallet;

      if (!devId) {
        txForWallet = makeRegisterTx({ username: developer.username, blobId, sender });
      } else {
        txForWallet = makeUpdateProfileTx({ devObjectId: devId, blobId, sender });
      }

      // Step 4: Sign and execute
      setWalrusStep("✍️ Please sign the transaction in your wallet...");
      const exec = await signAndExecute({ transaction: txForWallet });
      if (!exec?.digest) {
        throw new Error("Transaction failed");
      }

      // Step 5: Update database
      setWalrusStep("💾 Updating database...");
      const response = await fetch("/api/profile/push-walrus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileData: { blobId, blobObjectId },
          txDigest: exec.digest,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update Walrus blob ID");
      }

      setWalrusStep("");
      setWalrusSuccess("✅ Profile pushed to Walrus successfully!");
      
      // Reload page after 2 seconds to show onchain badge
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("Walrus push error:", err);
      setWalrusError(err.message || "Failed to push to Walrus");
      setWalrusStep("");
      setWalrusLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={developer.name}
          required
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="bio" className="mb-2 block text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={developer.bio || ""}
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="entry" className="mb-2 block text-sm font-medium">
          Level/Role
        </label>
        <input
          type="text"
          id="entry"
          name="entry"
          defaultValue={developer.entry || ""}
          placeholder="e.g., Senior Developer, Newbie, etc."
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="github" className="mb-2 block text-sm font-medium">
          GitHub URL
        </label>
        <input
          type="url"
          id="github"
          name="github"
          defaultValue={developer.github || ""}
          placeholder="https://github.com/username"
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="linkedin" className="mb-2 block text-sm font-medium">
          LinkedIn URL
        </label>
        <input
          type="url"
          id="linkedin"
          name="linkedin"
          defaultValue={developer.linkedin || ""}
          placeholder="https://linkedin.com/in/username"
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="telegram" className="mb-2 block text-sm font-medium">
          Telegram
        </label>
        <input
          type="text"
          id="telegram"
          name="telegram"
          defaultValue={developer.telegram || ""}
          placeholder="https://t.me/username or @username"
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="website" className="mb-2 block text-sm font-medium">
          Website
        </label>
        <input
          type="url"
          id="website"
          name="website"
          defaultValue={developer.website || ""}
          placeholder="https://yourwebsite.com"
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Sui Wallet Address (Testnet)
        </label>
        <div className="space-y-2">
          {bindedWallet ? (
            <div className="flex items-center gap-2">
              <div className="bg-background flex-1 rounded-md border px-3 py-2">
                <code className="text-sm">
                  {bindedWallet.slice(0, 8)}...{bindedWallet.slice(-6)}
                </code>
              </div>
              <Button
                type="button"
                onClick={() => {
                  open({ content: <WalletBindModal onBind={handleWalletChange} onClose={close} /> });
                }}
                disabled={loading}
                className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Change
              </Button>
              <Button
                type="button"
                onClick={() => handleWalletChange("")}
                disabled={loading}
                className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Unbind
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => {
                open({ content: <WalletBindModal onBind={handleWalletChange} onClose={close} /> });
              }}
              disabled={loading}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Bind Sui Wallet
            </Button>
          )}
        </div>
        <input
          type="hidden"
          name="slush_wallet"
          value={bindedWallet}
        />
      </div>

      <div>
        <label htmlFor="avatar" className="mb-2 block text-sm font-medium">
          Avatar URL
        </label>
        <input
          type="url"
          id="avatar"
          name="avatar"
          defaultValue={developer.avatar || ""}
          placeholder="https://example.com/avatar.jpg"
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
        />
      </div>

      {/* Walrus Push Section */}
      <div className="rounded-lg border border-blue-400/30 bg-blue-400/5 p-4">
        <div className="mb-3 flex items-start gap-2">
          <input
            type="checkbox"
            id="enableWalrusPush"
            checked={enableWalrusPush}
            onChange={(e) => setEnableWalrusPush(e.target.checked)}
            disabled={!bindedWallet || loading || walrusLoading}
            className="mt-1"
          />
          <label htmlFor="enableWalrusPush" className="flex-1 text-sm">
            <span className="font-semibold">Push to Walrus (Onchain Storage)</span>
            <p className="mt-1 text-xs text-white/70">
              Store your profile on Sui blockchain for verifiability and censorship-resistance.
              Costs ~0.01 SUI for transaction fees. {!bindedWallet && "(Bind wallet first)"}
            </p>
          </label>
        </div>

        {developer.walrus_blob_id && (
          <div className="mt-2 rounded-md bg-green-400/10 border border-green-400/30 p-2 text-xs">
            <span className="font-semibold text-green-300">✓ Already onchain:</span>{" "}
            <code className="text-green-200">{developer.walrus_blob_id.slice(0, 12)}...</code>
          </div>
        )}

        {walrusStep && (
          <div className="mt-2 rounded-md bg-blue-50 border border-blue-400/30 p-2 text-xs text-blue-800">
            <span className="flex items-center gap-2">
              <svg className="h-3 w-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {walrusStep}
            </span>
          </div>
        )}

        {walrusError && (
          <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-800">
            {walrusError}
          </div>
        )}

        {walrusSuccess && (
          <div className="mt-2 rounded-md bg-green-50 p-2 text-xs text-green-800">
            {walrusSuccess}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || walrusLoading}
        className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {walrusLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Pushing to Walrus Onchain...
          </span>
        ) : loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </span>
        ) : enableWalrusPush ? (
          "💎 Save & Push to Walrus"
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  );
}

interface WalletConnectPromptProps {
  onClose: () => void;
}

function WalletConnectPrompt({ onClose }: WalletConnectPromptProps) {
  const wallets = useWallets();
  const { mutate: connect } = useConnectWallet();

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold">Connect Wallet to Push Onchain</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        You need to connect your Sui wallet to sign the transaction and push your profile to Walrus.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {wallets.map(wallet => (
          <Button
            onClick={() => {
              connect(
                { wallet },
                {
                  onError: (error) => {
                    console.error("Failed to connect wallet:", error);
                    onClose();
                  }
                }
              );
            }}
            key={wallet.name}
            className="flex items-center gap-2 px-2"
          >
            <img
              src={wallet.icon}
              alt={wallet.name}
              className="size-12 rounded-full"
            />
            {wallet.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

interface WalletBindModalProps {
  onBind: (address: string) => void;
  onClose: () => void;
}

function WalletBindModal({ onBind, onClose }: WalletBindModalProps) {
  const wallets = useWallets();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const currentAccount = useCurrentAccount();
  const isConnectingRef = useRef(false);

  // Only bind if user just connected (not already connected before opening modal)
  useEffect(() => {
    if (currentAccount?.address && isConnectingRef.current) {
      onBind(currentAccount.address);
      onClose();
      isConnectingRef.current = false;
    }
  }, [currentAccount, onBind, onClose]);

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold">Connect Sui Wallet</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Connect your Sui wallet to bind it to your profile (Testnet)
      </p>

      {currentAccount ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              Already connected: <code className="font-mono font-semibold">{currentAccount.address.slice(0, 8)}...{currentAccount.address.slice(-6)}</code>
            </p>
          </div>
          <Button
            onClick={() => {
              onBind(currentAccount.address);
              onClose();
            }}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            Use This Wallet
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">Or</span>
            </div>
          </div>
          <Button
            onClick={() => disconnect()}
            className="w-full border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50"
          >
            Disconnect & Choose Another
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {wallets.map(wallet => (
            <Button
              onClick={() => {
                isConnectingRef.current = true;
                connect(
                  { wallet },
                  {
                    onSuccess: () => {
                      // useEffect will handle binding after connection
                    },
                    onError: (error) => {
                      console.error("Failed to connect wallet:", error);
                      isConnectingRef.current = false;
                    }
                  }
                );
              }}
              key={wallet.name}
              className="flex items-center gap-2 px-2"
            >
              <img
                src={wallet.icon}
                alt={wallet.name}
                className="size-12 rounded-full"
              />
              {wallet.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

