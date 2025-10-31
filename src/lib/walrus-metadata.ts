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