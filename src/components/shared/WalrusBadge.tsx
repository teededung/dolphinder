import React from "react";

interface WalrusBadgeProps {
  /** 'onchain' shows Walrus badge, 'offchain' shows Offchain badge */
  variant: "onchain" | "offchain";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
}

/**
 * Badge component to indicate if a profile is stored on Walrus (onchain) or only in Supabase (offchain)
 */
export default function WalrusBadge({ variant, size = "md", className = "" }: WalrusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  if (variant === "onchain") {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-emerald-500/10 font-medium text-emerald-400 ${sizeClasses[size]} ${className}`}
      >
        <img src="/walrus-token.svg" alt="Walrus" className={iconSizes[size]} />
        <span>Walrus</span>
      </span>
    );
  }

  // Offchain variant
  return (
    <span
      className={`inline-flex items-center rounded-full bg-orange-500/10 font-medium text-orange-400 ${sizeClasses[size]} ${className}`}
    >
      <svg
        className={iconSizes[size]}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
      <span>Offchain</span>
    </span>
  );
}

