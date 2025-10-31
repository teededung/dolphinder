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
