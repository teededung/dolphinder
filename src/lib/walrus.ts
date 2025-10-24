/**
 * Walrus utilities for uploading and fetching JSON blobs.
 * Publisher (write) and Aggregator (read) URLs are configured via env.
 */

export type WalrusUploadResponse = {
  blobId: string;
};

/**
 * Upload a JSON-serializable object to Walrus Publisher.
 * Returns the content-addressed blobId string.
 */
export async function uploadJson(data: unknown): Promise<WalrusUploadResponse> {
  const PUBLISHER_URL = (import.meta as any).env?.PUBLIC_WALRUS_PUBLISHER_URL 
    ?? (typeof process !== 'undefined' ? (process as any).env?.WALRUS_PUBLISHER_URL : undefined);
  if (!PUBLISHER_URL) {
    throw new Error('WALRUS_PUBLISHER_URL is not configured');
  }

  const payload = typeof data === 'string' ? data : JSON.stringify(data);

  const base = String(PUBLISHER_URL).replace(/\/$/, '');
  // According to Walrus docs, publisher write endpoint is usually /v1/blobs (PUT),
  // but different providers may accept different content-types or verbs.
  const candidates: { url: string; method: 'PUT' | 'POST'; contentType?: string }[] = [
    { url: `${base}/v1/blobs`, method: 'PUT', contentType: 'application/octet-stream' },
    { url: `${base}/v1/blobs`, method: 'PUT', contentType: 'text/plain' },
    { url: `${base}/v1/blobs`, method: 'POST', contentType: 'application/octet-stream' },
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
      // { blobId } | { id } | { newlyCreated: { blobObject: { blobId }}}
      let blobId: string | undefined =
        out.blobId || out.blob_id || out.id || out.hash || out.blob || out.result;
      if (!blobId && out?.newlyCreated?.blobObject?.blobId) {
        blobId = out.newlyCreated.blobObject.blobId;
      }
      if (!blobId || typeof blobId !== 'string') {
        errors.push(`${c.method} ${c.url} -> missing blobId field`);
        continue;
      }
      return { blobId };
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


