import { useState, useEffect, useRef, type FormEvent } from "react";
import { useCurrentAccount, useWallets, useConnectWallet, useDisconnectWallet } from "@mysten/dapp-kit";
import { Button } from "./Button";
import type { Developer } from "../../lib/auth";
import { useModalStore } from "../../store/useModalStore";

interface ProfileFormProps {
  developer: Developer;
}

export default function ProfileForm({ developer }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bindedWallet, setBindedWallet] = useState<string>(developer.slush_wallet || "");
  
  const currentAccount = useCurrentAccount();
  const { open, close } = useModalStore();

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

      // Reload page after 1 second to show updated profile
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile");
      setLoading(false);
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
        disabled={loading}
        className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
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

