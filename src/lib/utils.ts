import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Shortens a wallet address to the format: 0x1234...5678
 * @param address - The full wallet address
 * @returns Shortened address or 'Unknown' if invalid
 */
export function shortenAddress(address: string | null | undefined): string {
  if (!address || address.length < 10) return address || 'Unknown';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}
