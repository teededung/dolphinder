/**
 * Blockchain explorer utilities
 * Helper functions to generate URLs for blockchain explorers
 */

export type Network = 'mainnet' | 'testnet';

/**
 * Generate Suiscan URL for a Sui object
 * @param objectId - The Sui object ID
 * @param network - Network (mainnet or testnet)
 * @returns Full Suiscan URL
 */
export function getSuiscanObjectUrl(
  objectId: string,
  network: Network = 'testnet'
): string {
  return `https://suiscan.xyz/${network}/object/${objectId}/fields`;
}

/**
 * Generate Walruscan URL for a Walrus blob
 * Note: Walruscan may not have a dedicated explorer yet.
 * This assumes a similar pattern to other blockchain explorers.
 * @param blobId - The Walrus blob ID
 * @param network - Network (mainnet or testnet)
 * @returns Full Walruscan URL (may need adjustment based on actual Walrus explorer)
 */
export function getWalruscanBlobUrl(
  blobId: string,
  network: Network = 'testnet'
): string {
  // TODO: Verify this URL format with Walrus documentation
  // Possible alternatives:
  // - https://testnet.walruscan.com/blob/{blobId}
  // - https://walrus.sui.io/testnet/blob/{blobId}
  // For now, using aggregator URL pattern as fallback
  const aggregatorUrl = network === 'testnet' 
    ? 'https://aggregator.walrus-testnet.walrus.space'
    : 'https://aggregator.walrus.space';
  
  return `${aggregatorUrl}/v1/${blobId}`;
}

/**
 * Generate Walrus aggregator direct access URL
 * This is the actual URL to access blob content
 * @param blobId - The Walrus blob ID
 * @param network - Network (mainnet or testnet)
 * @returns Walrus aggregator URL
 */
export function getWalrusAggregatorUrl(
  blobId: string,
  network: Network = 'testnet'
): string {
  const baseUrl = network === 'testnet'
    ? 'https://aggregator.walrus-testnet.walrus.space'
    : 'https://aggregator.walrus.space';
  
  return `${baseUrl}/v1/blobs/${blobId}`;
}

