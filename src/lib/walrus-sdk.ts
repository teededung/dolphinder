/**
 * Walrus TypeScript SDK client for reading quilt patches
 * 
 * This provides full support for reading individual patches from quilts,
 * which is not available via HTTP API.
 * 
 * See: https://sdk.mystenlabs.com/walrus
 */

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { walrus } from '@mysten/walrus';
import type { WalrusFile } from '@mysten/walrus';

// Use any type to avoid complex Walrus SDK type issues
let walrusClient: any = null;

/**
 * Create or get cached Walrus SDK client
 */
function createWalrusClient(): any {
  if (walrusClient) return walrusClient;

  const client = new SuiClient({
    url: getFullnodeUrl('testnet'),
    network: 'testnet',
  }).$extend(walrus());

  walrusClient = client;
  return client;
}

/**
 * Read a file from Walrus using quilt patch ID
 * 
 * @param quiltPatchId - The quilt patch ID (can be blob ID or quilt patch ID)
 * @returns Uint8Array of the file content, or null if failed
 */
export async function readWalrusFile(quiltPatchId: string): Promise<Uint8Array | null> {
  try {
    const client = createWalrusClient();
    
    // getFiles accepts both blob IDs and quilt patch IDs
    const [file] = await client.walrus.getFiles({ ids: [quiltPatchId] });
    
    if (!file) {
      return null;
    }
    
    // Get file content as Uint8Array
    const bytes = await file.bytes();
    
    return bytes;
  } catch (error: any) {
    return null;
  }
}

/**
 * Read multiple files from Walrus in batch
 * More efficient than reading one by one
 * 
 * @param quiltPatchIds - Array of quilt patch IDs
 * @returns Array of Uint8Arrays (null for failed reads)
 */
export async function readWalrusFiles(quiltPatchIds: string[]): Promise<(Uint8Array | null)[]> {
  try {
    const client = createWalrusClient();
    
    // Batch read is more efficient
    const files = await client.walrus.getFiles({ ids: quiltPatchIds });
    
    // Convert to Uint8Arrays
    const results = await Promise.all(
      files.map(async (file: WalrusFile | null) => {
        if (!file) {
          return null;
        }
        
        try {
          const bytes = await file.bytes();
          return bytes;
        } catch (error: any) {
          return null;
        }
      })
    );
    
    return results;
  } catch (error: any) {
    // Return array of nulls if batch read fails
    return quiltPatchIds.map(() => null);
  }
}

/**
 * Convert Uint8Array to blob URL for display
 * 
 * @param bytes - File content as Uint8Array
 * @param contentType - MIME type (e.g., 'image/jpeg')
 * @returns Blob URL that can be used in <img src>
 */
export function createBlobUrl(bytes: Uint8Array, contentType: string = 'application/octet-stream'): string {
  // Create blob from Uint8Array
  const blob = new Blob([new Uint8Array(bytes)], { type: contentType });
  return URL.createObjectURL(blob);
}

/**
 * Check if Walrus SDK is available in current environment
 * (requires WASM support)
 */
export function isWalrusSDKAvailable(): boolean {
  try {
    // Check if WebAssembly is available
    if (typeof WebAssembly === 'undefined') {
      return false;
    }
    
    // Check if we're in a browser or Node.js environment
    return typeof window !== 'undefined' || typeof process !== 'undefined';
  } catch {
    return false;
  }
}

