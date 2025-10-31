/**
 * Walrus utilities for uploading and fetching JSON blobs.
 * Publisher (write) and Aggregator (read) URLs are configured via env.
 */

export type WalrusUploadResponse = {
  blobId: string;
  blobObjectId?: string; // Sui object ID of the Blob (for metadata queries)
};

/**
 * Upload a JSON-serializable object to Walrus Publisher.
 * Returns the content-addressed blobId string.
 * 
 * @param data - Data to upload
 * @param epochs - Number of epochs to store (default: 3 days, ~3 days for testing)
 */
export async function uploadJson(data: unknown, epochs: number = 3): Promise<WalrusUploadResponse> {
  const PUBLISHER_URL = (import.meta as any).env?.PUBLIC_WALRUS_PUBLISHER_URL 
    ?? (typeof process !== 'undefined' ? (process as any).env?.WALRUS_PUBLISHER_URL : undefined);
  if (!PUBLISHER_URL) {
    throw new Error('WALRUS_PUBLISHER_URL is not configured');
  }

  const payload = typeof data === 'string' ? data : JSON.stringify(data);

  const base = String(PUBLISHER_URL).replace(/\/$/, '');
  // According to Walrus docs, publisher write endpoint is /v1/blobs?epochs=<number>
  // Epochs parameter specifies how long to store the blob
  const candidates: { url: string; method: 'PUT' | 'POST'; contentType?: string }[] = [
    { url: `${base}/v1/blobs?epochs=${epochs}`, method: 'PUT', contentType: 'application/octet-stream' },
    { url: `${base}/v1/blobs?epochs=${epochs}`, method: 'PUT', contentType: 'text/plain' },
    { url: `${base}/v1/blobs?epochs=${epochs}`, method: 'POST', contentType: 'application/octet-stream' },
  ];

  const errors: string[] = [];
  for (const c of candidates) {
    try {
      const res = await fetch(c.url, {
        method: c.method,
        headers: c.contentType ? { 'content-type': c.contentType } : undefined,
        body: typeof payload === 'string' ? payload : String(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        errors.push(`${c.method} ${c.url} -> ${res.status} ${text}`);
        continue;
      }
      const out = await res.json().catch(() => ({} as any));
      // Try multiple shapes:
      // { blobId } | { id } | { newlyCreated: { blobObject: { blobId, id }}}
      let blobId: string | undefined =
        out.blobId || out.blob_id || out.id || out.hash || out.blob || out.result;
      let blobObjectId: string | undefined;
      
      if (!blobId && out?.newlyCreated?.blobObject?.blobId) {
        blobId = out.newlyCreated.blobObject.blobId;
        blobObjectId = out.newlyCreated.blobObject.id; // Sui object ID
      }
      
      if (!blobId || typeof blobId !== 'string') {
        errors.push(`${c.method} ${c.url} -> missing blobId field`);
        continue;
      }
      
      console.log('[Walrus Upload] Success:', { blobId, blobObjectId });
      return { blobId, blobObjectId };
    } catch (e: any) {
      errors.push(`${c.method} ${c.url} -> ${String(e?.message || e)}`);
      continue;
    }
  }

  throw new Error(`Walrus upload failed: ${errors.join(' | ')}`);
}

/**
 * Fetch a JSON blob from Walrus Aggregator by blobId.
 */
export async function fetchJson<T = any>(blobId: string): Promise<T> {
  const AGGREGATOR_URL = (import.meta as any).env?.PUBLIC_WALRUS_AGGREGATOR_URL 
    ?? (typeof process !== 'undefined' ? (process as any).env?.WALRUS_AGGREGATOR_URL : undefined);
  if (!AGGREGATOR_URL) {
    throw new Error('WALRUS_AGGREGATOR_URL is not configured');
  }
  const endpoint = `${String(AGGREGATOR_URL).replace(/\/$/, '')}/v1/blobs/${encodeURIComponent(blobId)}`;
  const res = await fetch(endpoint, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Walrus fetch failed: ${res.status} ${text}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/**
 * Get Walrus aggregator URL for an image by its quilt patch ID.
 * Returns the full URL to fetch the image from Walrus.
 * 
 * Note: Blob IDs in Walrus are base64-encoded strings.
 * They may be stored as URL-safe base64 (with _ and -) but Walrus aggregator 
 * expects standard base64 (with + and /) or URL-encoded format.
 */
export function getWalrusImageUrl(quiltPatchId: string): string {
  const AGGREGATOR_URL = (import.meta as any).env?.PUBLIC_WALRUS_AGGREGATOR_URL 
    ?? (typeof process !== 'undefined' ? (process as any).env?.WALRUS_AGGREGATOR_URL : undefined);
  if (!AGGREGATOR_URL) {
    throw new Error('WALRUS_AGGREGATOR_URL is not configured');
  }
  
  // Try blob ID as-is first (most common case)
  // If quiltPatchId contains URL-safe base64 characters (_ or -), 
  // it might need to stay as-is since Walrus aggregator handles both formats
  return `${String(AGGREGATOR_URL).replace(/\/$/, '')}/v1/blobs/${quiltPatchId}`;
}

/**
 * Check if a Walrus image is accessible.
 * Returns true if the image exists and can be loaded.
 */
export async function checkWalrusImageExists(quiltPatchId: string): Promise<boolean> {
  try {
    const url = getWalrusImageUrl(quiltPatchId);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}


