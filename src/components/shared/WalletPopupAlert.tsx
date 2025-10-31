interface WalletPopupAlertProps {
  step: string;
}

export function WalletPopupAlert({ step }: WalletPopupAlertProps) {
  const shouldShow =
    step.includes("Uploading project images") ||
    step.includes("Uploading to Walrus") ||
    step.includes("Creating blockchain") ||
    step.includes("sign the transaction");

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="rounded-md bg-yellow-50 border border-yellow-400/30 p-2 text-xs text-yellow-800">
      <span className="flex items-center gap-2">
        <svg
          className="h-3 w-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <strong>Please wait for wallet popup to appear</strong>
      </span>
    </div>
  );
}
