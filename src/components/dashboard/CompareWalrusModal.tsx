import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../shared/Button";
import { fetchJson, uploadJson } from "../../lib/walrus";
import { getDevIdByUsername } from "../../lib/sui-views";
import { makeUpdateProfileTx } from "../../lib/sui-tx";
import type { Developer } from "../../lib/auth";
import { useModalStore } from "../../store/useModalStore";

interface CompareWalrusModalProps {
  open: boolean;
  onClose: () => void;
  walrusBlobId: string;
  blobObjectId: string;
  developer: Developer;
}

interface ProfileData {
  profile: {
    name: string;
    bio: string;
    entry: string;
    github: string;
    linkedin: string;
    telegram: string;
    website: string;
    avatar: string;
  };
  projects: any[];
  certificates: any[];
}

export default function CompareWalrusModal({
  open,
  onClose,
  walrusBlobId,
  blobObjectId,
  developer,
}: CompareWalrusModalProps) {
  const [loading, setLoading] = useState(false);
  const [onchainData, setOnchainData] = useState<ProfileData | null>(null);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncDirection, setSyncDirection] = useState<"to-walrus" | "to-offchain" | null>(null);
  const [syncStep, setSyncStep] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncSuccess, setSyncSuccess] = useState("");
  
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction() as any;
  const { open: openModal, close: closeModal } = useModalStore();

  // Fetch onchain data when modal opens
  useEffect(() => {
    if (open && walrusBlobId) {
      fetchOnchainData();
    }
  }, [open, walrusBlobId]);

  async function fetchOnchainData() {
    setLoading(true);
    setError("");
    setOnchainData(null);

    try {
      const data = await fetchJson<ProfileData>(walrusBlobId);
      setOnchainData(data);
      console.log("[Compare Modal] Fetched onchain data:", data);
    } catch (err: any) {
      console.error("[Compare Modal] Fetch error:", err);
      setError(err.message || "Failed to fetch onchain data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncToWalrus() {
    if (!currentAccount) {
      openModal({
        content: (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">Wallet Not Connected</h2>
            <p className="text-sm text-gray-600">
              Please connect your wallet first to sync to Walrus.
            </p>
          </div>
        ),
      });
      return;
    }

    setSyncing(true);
    setSyncDirection("to-walrus");
    setSyncError("");
    setSyncSuccess("");
    setSyncStep("");

    let blobId: string | undefined;
    let newBlobObjectId: string | undefined;

    try {
      // Step 1: Prepare data
      setSyncStep("📦 Preparing profile data...");

      // Convert avatar to base64 for Walrus blob
      let avatarBase64 = "";
      if (developer.avatar && developer.avatar.startsWith("/avatar/")) {
        try {
          const response = await fetch(developer.avatar);
          const blob = await response.blob();
          avatarBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.warn("Failed to fetch existing avatar for Walrus:", err);
          avatarBase64 = developer.avatar || "";
        }
      } else {
        avatarBase64 = developer.avatar || "";
      }

      const profileData: ProfileData = {
        profile: {
          name: developer.name,
          bio: developer.bio || "",
          entry: developer.entry || "",
          github: developer.github || "",
          linkedin: developer.linkedin || "",
          telegram: developer.telegram || "",
          website: developer.website || "",
          avatar: avatarBase64,
        },
        projects: developer.projects || [],
        certificates: developer.certificates || [],
      };

      console.log("[Sync to Walrus] Profile Data:", {
        ...profileData,
        profile: {
          ...profileData.profile,
          avatar: avatarBase64
            ? `${avatarBase64.slice(0, 50)}... (length: ${avatarBase64.length})`
            : "No avatar",
        },
      });

      // Step 2: Upload to Walrus
      setSyncStep("🐋 Uploading to Walrus storage...");
      const uploadResult = await uploadJson(profileData);
      blobId = uploadResult.blobId;
      newBlobObjectId = uploadResult.blobObjectId;

      console.log("[Sync to Walrus] Upload Success:", { blobId, newBlobObjectId });

      // Step 3: Create transaction
      setSyncStep("⚙️ Creating blockchain transaction...");
      const devId = await getDevIdByUsername(developer.username);
      if (!devId) {
        throw new Error("Developer profile not found on blockchain");
      }

      const sender = currentAccount.address;
      const txForWallet = makeUpdateProfileTx({
        devObjectId: devId,
        blobId,
        sender,
      });

      // Step 4: Sign and execute transaction
      setSyncStep("✍️ Please sign the transaction in your wallet...");
      const exec = await signAndExecute({ transaction: txForWallet });
      if (!exec?.digest) {
        throw new Error("Transaction failed");
      }

      // Step 5: Update database
      setSyncStep("💾 Saving to database...");

      const response = await fetch("/api/profile/push-walrus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walrusData: { blobId, blobObjectId: newBlobObjectId },
          profileFields: {
            name: developer.name,
            bio: developer.bio || "",
            entry: developer.entry || "",
            github: developer.github || "",
            linkedin: developer.linkedin || "",
            telegram: developer.telegram || "",
            website: developer.website || "",
            avatar: developer.avatar || "",
            projects: developer.projects || [],
            certificates: developer.certificates || [],
          },
          txDigest: exec.digest,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save profile");
      }

      setSyncStep("");
      setSyncSuccess("✅ Successfully synced to Walrus!");

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("[Sync to Walrus] Error:", err);
      setSyncError(err.message || "Failed to sync to Walrus");
      setSyncStep("");
    } finally {
      setSyncing(false);
      setSyncDirection(null);
    }
  }

  async function handleSyncToOffchain() {
    setSyncing(true);
    setSyncDirection("to-offchain");
    setSyncError("");
    setSyncSuccess("");
    setSyncStep("");

    try {
      setSyncStep("📥 Fetching data from Walrus...");

      const response = await fetch("/api/profile/sync-from-walrus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walrusBlobId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to sync from Walrus");
      }

      setSyncStep("");
      setSyncSuccess("✅ Successfully synced from Walrus!");

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("[Sync to Offchain] Error:", err);
      setSyncError(err.message || "Failed to sync to offchain");
      setSyncStep("");
    } finally {
      setSyncing(false);
      setSyncDirection(null);
    }
  }

  // Prepare offchain data in same format as onchain
  const offchainData: ProfileData = {
    profile: {
      name: developer.name,
      bio: developer.bio || "",
      entry: developer.entry || "",
      github: developer.github || "",
      linkedin: developer.linkedin || "",
      telegram: developer.telegram || "",
      website: developer.website || "",
      avatar: developer.avatar || "",
    },
    projects: developer.projects || [],
    certificates: developer.certificates || [],
  };

  const fields = [
    { key: "name", label: "Name" },
    { key: "bio", label: "Bio" },
    { key: "entry", label: "Level/Role" },
    { key: "github", label: "GitHub" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "telegram", label: "Telegram" },
    { key: "website", label: "Website" },
    { key: "avatar", label: "Avatar" },
  ];

  // Check if there are any differences between offchain and onchain data
  const hasAnyDifference = onchainData
    ? (() => {
        console.log("=== COMPARISON DEBUG ===");
        console.log("Offchain Data:", JSON.stringify(offchainData, null, 2));
        console.log("Onchain Data:", JSON.stringify(onchainData, null, 2));
        
        // Check profile fields (excluding avatar - it can be in different formats)
        const fieldDifferences = fields
          .filter((field) => field.key !== "avatar") // Skip avatar comparison
          .map((field) => {
            const offchainValue =
              offchainData.profile[field.key as keyof typeof offchainData.profile];
            const onchainValue =
              onchainData.profile[field.key as keyof typeof onchainData.profile];
            const isDiff = offchainValue !== onchainValue;
            if (isDiff) {
              console.log(`Field "${field.key}" differs:`, {
                offchain: offchainValue,
                onchain: onchainValue,
              });
            }
            return isDiff;
          });
        
        const hasFieldDiff = fieldDifferences.some(Boolean);
        const hasProjectsDiff = JSON.stringify(offchainData.projects) !== JSON.stringify(onchainData.projects);
        const hasCertsDiff = JSON.stringify(offchainData.certificates) !== JSON.stringify(onchainData.certificates);
        
        console.log("Field differences (excluding avatar):", hasFieldDiff);
        console.log("Projects different:", hasProjectsDiff);
        console.log("Certificates different:", hasCertsDiff);
        console.log("Has any difference:", hasFieldDiff || hasProjectsDiff || hasCertsDiff);
        console.log("======================");
        
        return hasFieldDiff || hasProjectsDiff || hasCertsDiff;
      })()
    : false;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] !max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle>Compare Offchain vs Onchain Data</DialogTitle>
          <DialogDescription>
            Compare your profile data stored in the database (offchain) vs Walrus
            blockchain (onchain)
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <svg
              className="h-8 w-8 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && onchainData && (
          <div className="space-y-4">
            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-lg border border-emerald-400/30 bg-emerald-500/5">
              <table className="w-full text-sm">
                <thead className="bg-emerald-500/10">
                  <tr>
                    <th className="border-b border-emerald-400/30 px-4 py-3 text-left font-semibold text-white">
                      Field
                    </th>
                    <th className="border-b border-l border-emerald-400/30 px-4 py-3 text-left font-semibold text-white">
                      Offchain (Database)
                    </th>
                    <th className="border-b border-l border-emerald-400/30 px-4 py-3 text-left font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <img src="/walrus.svg" alt="Walrus" className="h-4 w-4" />
                        <span>Onchain (Walrus)</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => {
                    const offchainValue =
                      offchainData.profile[field.key as keyof typeof offchainData.profile];
                    const onchainValue =
                      onchainData.profile[field.key as keyof typeof onchainData.profile];
                    const isDifferent = offchainValue !== onchainValue;

                    return (
                      <tr
                        key={field.key}
                        className={isDifferent && field.key !== "avatar" ? "bg-yellow-500/10" : ""}
                      >
                        <td className="border-b border-emerald-400/20 px-4 py-3 font-medium text-white">
                          {field.label}
                        </td>
                        <td className="border-b border-l border-emerald-400/20 px-4 py-3">
                          {field.key === "avatar" && offchainValue ? (
                            <img
                              src={offchainValue}
                              alt="Offchain avatar"
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white/90">
                              {offchainValue || (
                                <span className="text-white/40">N/A</span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="border-b border-l border-emerald-400/20 px-4 py-3">
                          {field.key === "avatar" && onchainValue ? (
                            <img
                              src={onchainValue}
                              alt="Onchain avatar"
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white/90">
                              {onchainValue || (
                                <span className="text-white/40">N/A</span>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Projects */}
                  <tr>
                    <td className="border-b border-emerald-400/20 px-4 py-3 font-medium text-white">Projects</td>
                    <td className="border-b border-l border-emerald-400/20 px-4 py-3">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                          {offchainData.projects.length} projects
                        </summary>
                        <pre className="mt-2 max-h-32 overflow-auto rounded bg-white/5 p-2 text-white/90">
                          {JSON.stringify(offchainData.projects, null, 2)}
                        </pre>
                      </details>
                    </td>
                    <td className="border-b border-l border-emerald-400/20 px-4 py-3">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                          {onchainData.projects.length} projects
                        </summary>
                        <pre className="mt-2 max-h-32 overflow-auto rounded bg-white/5 p-2 text-white/90">
                          {JSON.stringify(onchainData.projects, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>

                  {/* Certificates */}
                  <tr>
                    <td className="border-b border-emerald-400/20 px-4 py-3 font-medium text-white">
                      Certificates
                    </td>
                    <td className="border-b border-l border-emerald-400/20 px-4 py-3">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                          {offchainData.certificates.length} certificates
                        </summary>
                        <pre className="mt-2 max-h-32 overflow-auto rounded bg-white/5 p-2 text-white/90">
                          {JSON.stringify(offchainData.certificates, null, 2)}
                        </pre>
                      </details>
                    </td>
                    <td className="border-b border-l border-emerald-400/20 px-4 py-3">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                          {onchainData.certificates.length} certificates
                        </summary>
                        <pre className="mt-2 max-h-32 overflow-auto rounded bg-white/5 p-2 text-white/90">
                          {JSON.stringify(onchainData.certificates, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Progress/Status Messages */}
            {syncStep && (
              <div className="rounded-md border border-blue-400/30 bg-blue-50 p-3 text-xs text-blue-800">
                <span className="flex items-center gap-2">
                  <svg
                    className="h-3 w-3 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {syncStep}
                </span>
              </div>
            )}

            {syncError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {syncError}
              </div>
            )}

            {syncSuccess && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                {syncSuccess}
              </div>
            )}

            {/* No Difference Message */}
            {!hasAnyDifference && (
              <div className="rounded-md bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-400">
                ✓ All data is synchronized! No differences found between offchain and onchain.
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSyncToWalrus}
                disabled={syncing || !hasAnyDifference}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing && syncDirection === "to-walrus" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Syncing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <img src="/walrus.svg" alt="Walrus" className="h-5 w-5" />
                    Sync to Walrus →
                  </span>
                )}
              </Button>

              <Button
                onClick={handleSyncToOffchain}
                disabled={syncing || !hasAnyDifference}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing && syncDirection === "to-offchain" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Syncing...
                  </span>
                ) : (
                  "← Sync to Offchain"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

