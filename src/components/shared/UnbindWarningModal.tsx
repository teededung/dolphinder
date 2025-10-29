import { useState } from "react";
import { Button } from "./Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { AlertTriangle, Info, Loader2, XCircle } from "lucide-react";

interface UnbindWarningModalProps {
  open: boolean;
  blobObjectId: string;
  walrusBlobId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UnbindWarningModal({ 
  open,
  blobObjectId, 
  walrusBlobId,
  onSuccess, 
  onCancel 
}: UnbindWarningModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("");

  async function handleConfirmDelete() {
    try {
      setLoading(true);
      setError("");
      
      // Clear database references only
      // Blob data remains on Walrus storage (immutable) but won't be linked to this profile
      setStep("Clearing on-chain profile references...");
      
      const response = await fetch("/api/profile/delete-walrus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearReferences: true }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to clear references");
      }

      setStep("Success!");
      
      // Call success callback
      onSuccess();

    } catch (err: any) {
      console.error("Clear Walrus references error:", err);
      setError(err.message || "Failed to clear references");
      setLoading(false);
      setStep("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !loading && onCancel()}>
      <DialogContent className="sm:max-w-[550px]" showCloseButton={!loading}>
        {/* Header */}
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <DialogTitle className="text-center text-2xl">Unbind Wallet</DialogTitle>
          <DialogDescription className="text-center">
            This action will affect your on-chain profile
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm leading-relaxed">
              You have a profile stored on <strong>Walrus blockchain</strong>. If you unbind your wallet, 
              the on-chain profile reference will be removed from your account.
            </p>
          </div>
          
          {/* Important Notice Box */}
          <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">Important Notice</h3>
            </div>
            <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Your profile will no longer show as "on-chain"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Blob data remains on Walrus storage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <div className="flex-1">
                  <span>Blob ID: </span>
                  <code className="rounded bg-yellow-100 px-2 py-0.5 font-mono text-xs dark:bg-yellow-900">
                    {walrusBlobId.slice(0, 20)}...
                  </code>
                </div>
              </li>
            </ul>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>Good news:</strong> You can always re-push your profile to Walrus later if needed.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {step && (
          <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">{step}</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-900 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={loading}
            className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Clear & Unbind"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

