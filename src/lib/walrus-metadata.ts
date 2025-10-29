/**
 * Walrus blob metadata utilities for querying storage information from Sui blockchain
 * 
 * Note: This module can work with either:
 * 1. Sui Client SDK - Query by blob_object_id (Sui object ID)
 * 2. Walrus Client SDK - Query by blobId (content hash) - RECOMMENDED
 * 
 * Using Walrus SDK is recommended because:
 * - Can query using blobId (which we store in database)
 * - Provides blob content access
 * - Built-in support for epochs parameter
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

export interface WalrusBlobMetadata {
  registered_epoch?: number;
  certified_epoch?: number;
  storage?: {
    start_epoch: number;
    end_epoch: number;
    storage_size?: number;
  };
  size?: number;
  deletable?: boolean;
  blob_id?: string;
}

/**
 * Get Blob metadata using blobId (content hash) via Walrus SDK
 * 
 * @deprecated Use getBlobMetadata() with blob_object_id instead
 * @param blobId - Walrus blob ID (content hash)
 * @param network - Network (mainnet or testnet)
 * @returns Always returns null - use blob_object_id approach instead
 */
export async function getBlobMetadataByBlobId(
  blobId: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<WalrusBlobMetadata | null> {
  console.warn('[WalrusMetadata] getBlobMetadataByBlobId is deprecated');
  console.warn('[WalrusMetadata] Cannot query blob metadata by blobId (content hash) alone');
  console.warn('[WalrusMetadata] Use getBlobMetadata() with blob_object_id instead');
  return null;
}

/**
 * Get current epoch from Walrus system using Walrus SDK
 * Note: Walrus has its own epoch system, different from Sui epochs
 * 
 * IMPORTANT: Walrus epochs are NOT directly queryable from System object.
 * We use the Sui blockchain epoch as a proxy since Walrus epochs are 
 * synchronized with Sui epochs on testnet.
 * 
 * Alternative: Use certified_epoch from recent blob as reference point.
 */
export async function getCurrentEpoch(network: 'mainnet' | 'testnet' = 'testnet'): Promise<number> {
  try {
    // Dynamically import Walrus SDK
    const { SuiJsonRpcClient } = await import('@mysten/sui/jsonRpc');
    const { walrus } = await import('@mysten/walrus');
    
    const client = new SuiJsonRpcClient({
      url: getFullnodeUrl(network),
      network: network,
    }).$extend(walrus());
    
    // Try to get system info from Walrus SDK
    // The Walrus SDK may expose system info methods
    console.log('[WalrusMetadata] Querying Walrus system info...');
    
    // Unfortunately, Walrus SDK doesn't expose getCurrentEpoch() directly
    // Fallback: Use Sui epoch as Walrus testnet is synced with Sui epochs
    const suiClient = new SuiClient({ url: getFullnodeUrl(network) });
    const systemState = await suiClient.getLatestSuiSystemState();
    const suiEpoch = parseInt(systemState.epoch);
    
    // For Walrus testnet, epochs are roughly aligned with Sui epochs
    // but offset by the Walrus genesis epoch
    // Based on your blob data: registered_epoch=208, certified_epoch=208
    // And Sui epoch=902, we can see Walrus is much behind
    
    // WORKAROUND: Since we can't directly query Walrus current epoch,
    // we'll use the blob's certified_epoch as a reference point
    // This is passed separately and calculated in the UI
    
    console.log('[WalrusMetadata] Sui epoch:', suiEpoch);
    console.warn('[WalrusMetadata] Cannot directly query Walrus current epoch');
    console.warn('[WalrusMetadata] Will use blob certified_epoch as reference');
    
    // Return 0 to indicate we should use blob metadata for epoch calculations
    return 0;
  } catch (error) {
    console.error('[WalrusMetadata] Failed to get current epoch:', error);
    return 0;
  }
}

/**
 * Query Walrus blob metadata from Sui blockchain
 * 
 * Note: The blobObjectId is different from the blob_id (content hash).
 * This function queries the Blob object on Sui to get storage metadata.
 * 
 * @param blobObjectId - The Sui object ID of the Blob (not the content blob_id)
 * @param network - Sui network (mainnet or testnet)
 * @returns Blob metadata including epoch information, or null if not found
 */
export async function getBlobMetadata(
  blobObjectId: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<WalrusBlobMetadata | null> {
  try {
    const client = new SuiClient({ url: getFullnodeUrl(network) });
    
    // Query the Blob object
    const response = await client.getObject({
      id: blobObjectId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (!response.data) {
      console.warn(`Blob object ${blobObjectId} not found`);
      return null;
    }

    // Parse the Blob object fields
    const content: any = response.data.content;
    if (!content || content.dataType !== 'moveObject') {
      console.warn('Blob object does not have move object content');
      return null;
    }

    const fields = content.fields;
    
    // Extract blob metadata from fields
    // Based on actual Walrus Blob structure from SuiVision:
    // {
    //   "blob_id": "...",
    //   "registered_epoch": 208,
    //   "certified_epoch": 208,
    //   "size": "313",
    //   "deletable": true,
    //   "encoding_type": 1,
    //   "storage": {
    //     "fields": {
    //       "start_epoch": 208,
    //       "end_epoch": 209,
    //       "storage_size": "66034000"
    //     },
    //     "type": "..."
    //   }
    // }
    
    const metadata: WalrusBlobMetadata = {
      registered_epoch: fields.registered_epoch ? parseInt(fields.registered_epoch.toString()) : undefined,
      certified_epoch: fields.certified_epoch ? parseInt(fields.certified_epoch.toString()) : undefined,
      size: fields.size ? parseInt(fields.size.toString()) : undefined,
      deletable: fields.deletable === true,
    };

    // Parse storage information
    // Storage is a nested object with fields property
    if (fields.storage) {
      const storage = fields.storage;
      // Storage can be either direct fields or nested in 'fields' property
      const storageFields = storage.fields || storage;
      
      if (typeof storageFields === 'object' && storageFields !== null) {
        const startEpoch = storageFields.start_epoch || storageFields.startEpoch;
        const endEpoch = storageFields.end_epoch || storageFields.endEpoch;
        const storageSize = storageFields.storage_size || storageFields.storageSize;
        
        metadata.storage = {
          start_epoch: startEpoch ? parseInt(startEpoch.toString()) : 0,
          end_epoch: endEpoch ? parseInt(endEpoch.toString()) : 0,
          storage_size: storageSize ? parseInt(storageSize.toString()) : undefined,
        };
      }
    }

    // Try to extract blob_id if available
    if (fields.blob_id) {
      // blob_id is u256, represented as string
      metadata.blob_id = fields.blob_id.toString();
    }

    return metadata;
  } catch (error) {
    console.error(`Failed to fetch blob metadata for ${blobObjectId}:`, error);
    return null;
  }
}

/**
 * Calculate days until blob storage expires
 * 
 * @param currentEpoch - Current Sui epoch
 * @param endEpoch - Blob storage end epoch
 * @param epochDurationHours - Duration of each epoch in hours (default 24)
 * @returns Number of days until expiry (can be negative if already expired)
 */
export function calculateDaysUntilExpiry(
  currentEpoch: number,
  endEpoch: number,
  epochDurationHours: number = 24
): number {
  const epochsRemaining = endEpoch - currentEpoch;
  const hoursRemaining = epochsRemaining * epochDurationHours;
  return Math.floor(hoursRemaining / 24);
}

/**
 * Check if blob storage is expiring soon (within warning period)
 * 
 * @param endEpoch - Blob storage end epoch
 * @param currentEpoch - Current Sui epoch
 * @param warningDays - Number of days before expiry to show warning (default 30)
 * @param epochDurationHours - Duration of each epoch in hours (default 24)
 * @returns True if blob will expire within warning period
 */
export function isExpiringWithinDays(
  endEpoch: number,
  currentEpoch: number,
  warningDays: number = 30,
  epochDurationHours: number = 24
): boolean {
  const daysUntilExpiry = calculateDaysUntilExpiry(currentEpoch, endEpoch, epochDurationHours);
  return daysUntilExpiry >= 0 && daysUntilExpiry <= warningDays;
}

/**
 * Check if blob storage has already expired
 * 
 * @param endEpoch - Blob storage end epoch
 * @param currentEpoch - Current Sui epoch
 * @returns True if blob has expired
 */
export function isExpired(endEpoch: number, currentEpoch: number): boolean {
  return currentEpoch >= endEpoch;
}

/**
 * Format epoch information for display
 * 
 * @param epoch - Epoch number
 * @param currentEpoch - Current epoch (optional, for relative display)
 * @returns Formatted string
 */
export function formatEpoch(epoch: number, currentEpoch?: number): string {
  if (currentEpoch !== undefined) {
    const diff = epoch - currentEpoch;
    if (diff === 0) return `${epoch} (current)`;
    if (diff > 0) return `${epoch} (in ${diff} epochs)`;
    return `${epoch} (${Math.abs(diff)} epochs ago)`;
  }
  return epoch.toString();
}

