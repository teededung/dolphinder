/**
 * Walrus Quilt utilities for batch storage of project images.
 * Quilt allows storing multiple small blobs as a single unit, reducing costs by 190-409x.
 */

export type QuiltUploadResponse = {
  quiltId: string;
  blobObjectId?: string; // Sui object ID of the Quilt
  patches: {
    identifier: string;
    patchId: string;
  }[];
};

/**
 * Helper to convert blob to base64 data URL
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload multiple images as a Walrus Quilt.
 * Each image is identified by a unique identifier (e.g., "projectId_img0").
 * 
 * @param images - Array of images with base64 data and identifiers
 * @param epochs - Number of epochs to store (default: 3)
 * @returns QuiltUploadResponse with quiltId and patch IDs
 */
export async function uploadQuilt(
  images: { data: string; identifier: string }[],
  epochs: number = 3
): Promise<QuiltUploadResponse> {
  const PUBLISHER_URL = (import.meta as any).env?.PUBLIC_WALRUS_PUBLISHER_URL 
    ?? (typeof process !== 'undefined' ? (process as any).env?.WALRUS_PUBLISHER_URL : undefined);
  
  if (!PUBLISHER_URL) {
    throw new Error('WALRUS_PUBLISHER_URL is not configured');
  }

  if (!images || images.length === 0) {
    throw new Error('No images provided for quilt upload');
  }

  // Validate max 666 patches per quilt (QuiltV1 limit)
  if (images.length > 666) {
    throw new Error('Maximum 666 images per quilt (QuiltV1 limit)');
  }

  const base = String(PUBLISHER_URL).replace(/\/$/, '');
  const url = `${base}/v1/quilts?epochs=${epochs}`;

  try {
    // Create FormData with multipart entries
    const formData = new FormData();
    
    for (const img of images) {
      // Convert base64 to Blob
      let blob: Blob;
      
      if (img.data.startsWith('data:')) {
        // Data URL format: data:image/png;base64,iVBOR...
        const [header, base64Data] = img.data.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: mimeType });
      } else {
        // Assume raw base64
        const binaryString = atob(img.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: 'application/octet-stream' });
      }

      // Append to form data with identifier as field name
      formData.append(img.identifier, blob, img.identifier);
    }

    console.log(`[Walrus Quilt] Uploading ${images.length} images to quilt...`);

    const response = await fetch(url, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Walrus quilt upload failed: ${response.status} ${text}`);
    }

    const result = await response.json().catch(() => ({} as any));
    console.log('[Walrus Quilt] Upload response:', result);

    // Parse response from Walrus Publisher
    // Format: {
    //   blobStoreResult: { newlyCreated: { blobObject: { blobId, id } } },
    //   storedQuiltBlobs: [{ identifier, quiltPatchId, range }]
    // }
    
    let quiltId: string | undefined;
    let blobObjectId: string | undefined;
    let patches: { identifier: string; patchId: string }[] = [];

    // Extract from blobStoreResult
    if (result.blobStoreResult?.newlyCreated?.blobObject?.blobId) {
      quiltId = result.blobStoreResult.newlyCreated.blobObject.blobId;
      blobObjectId = result.blobStoreResult.newlyCreated.blobObject.id;
    }

    // Extract patches from storedQuiltBlobs
    if (Array.isArray(result.storedQuiltBlobs)) {
      patches = result.storedQuiltBlobs.map((blob: any) => ({
        identifier: blob.identifier,
        patchId: blob.quiltPatchId,
      }));
    }

    if (!quiltId || typeof quiltId !== 'string') {
      throw new Error('Walrus quilt upload response missing blobId field');
    }

    if (patches.length === 0) {
      throw new Error('Walrus quilt upload response missing storedQuiltBlobs');
    }

    console.log('[Walrus Quilt] Upload success:', { quiltId, blobObjectId, patchCount: patches.length });

    return { quiltId, blobObjectId, patches };
  } catch (err: any) {
    console.error('[Walrus Quilt] Upload error:', err);
    throw new Error(`Walrus quilt upload failed: ${err.message || err}`);
  }
}

/**
 * Fetch a specific patch from a Walrus Quilt.
 * 
 * @param quiltId - The Quilt ID
 * @param patchId - The Patch ID (identifier used during upload)
 * @returns Blob of the image data
 */
export async function fetchQuiltPatch(
  quiltId: string, 
  patchId: string
): Promise<Blob> {
  const AGGREGATOR_URL = (import.meta as any).env?.PUBLIC_WALRUS_AGGREGATOR_URL 
    ?? (typeof process !== 'undefined' ? (process as any).env?.WALRUS_AGGREGATOR_URL : undefined);
  
  if (!AGGREGATOR_URL) {
    throw new Error('WALRUS_AGGREGATOR_URL is not configured');
  }

  const base = String(AGGREGATOR_URL).replace(/\/$/, '');
  const url = `${base}/v1/quilts/${encodeURIComponent(quiltId)}/${encodeURIComponent(patchId)}`;

  try {
    const response = await fetch(url, { method: 'GET' });
    
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Walrus quilt fetch failed: ${response.status} ${text}`);
    }

    return await response.blob();
  } catch (err: any) {
    console.error('[Walrus Quilt] Fetch error:', err);
    throw new Error(`Walrus quilt fetch failed: ${err.message || err}`);
  }
}

/**
 * Get the URL for a specific patch in a Walrus Quilt.
 * This can be used directly in <img> src attributes.
 * 
 * @param quiltId - The Quilt ID
 * @param patchId - The Patch ID (identifier used during upload)
 * @returns URL string for the patch
 */
export function getQuiltPatchUrl(quiltId: string, patchId: string): string {
  const AGGREGATOR_URL = (import.meta as any).env?.PUBLIC_WALRUS_AGGREGATOR_URL 
    ?? (typeof process !== 'undefined' ? (process as any).env?.WALRUS_AGGREGATOR_URL : undefined);
  
  if (!AGGREGATOR_URL) {
    console.error('WALRUS_AGGREGATOR_URL is not configured');
    return '';
  }

  const base = String(AGGREGATOR_URL).replace(/\/$/, '');
  return `${base}/v1/quilts/${encodeURIComponent(quiltId)}/${encodeURIComponent(patchId)}`;
}

