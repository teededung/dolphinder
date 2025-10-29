import { useState } from "react";
import { Button } from "../shared/Button";
import { fetchJson } from "../../lib/walrus";

interface WalrusBlobDebugProps {
  blobId: string;
}

export default function WalrusBlobDebug({ blobId }: WalrusBlobDebugProps) {
  const [loading, setLoading] = useState(false);
  const [blobData, setBlobData] = useState<any>(null);
  const [error, setError] = useState("");

  async function fetchBlobContent() {
    setLoading(true);
    setError("");
    setBlobData(null);

    try {
      const data = await fetchJson(blobId);
      setBlobData(data);
      console.log('[Walrus Blob Debug] Fetched Blob Content:', data);
      
      // Special handling for avatar to show metadata
      if (data?.profile?.avatar) {
        const avatar = data.profile.avatar;
        if (avatar.startsWith('data:')) {
          const [header, base64Data] = avatar.split(',');
          console.log('[Walrus Blob Debug] Avatar Info:', {
            type: header,
            base64Length: base64Data?.length || 0,
            estimatedSizeKB: Math.round((base64Data?.length || 0) * 0.75 / 1024),
            preview: avatar.slice(0, 100) + '...',
          });
        }
      }
    } catch (err: any) {
      console.error('[Walrus Blob Debug] Fetch Error:', err);
      setError(err.message || "Failed to fetch blob");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-purple-400/30 bg-purple-400/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-purple-300">
          🐛 Debug: Walrus Blob Content
        </h3>
        <Button
          onClick={fetchBlobContent}
          disabled={loading}
          className="text-xs bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Fetch Blob"}
        </Button>
      </div>

      <div className="text-xs text-gray-400">
        <p className="mb-2">
          <span className="font-semibold">Blob ID:</span> {blobId}
        </p>
      </div>

      {error && (
        <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-800">
          {error}
        </div>
      )}

      {blobData && (
        <div className="mt-3 space-y-3">
          {/* Avatar Preview */}
          {blobData?.profile?.avatar && blobData.profile.avatar.startsWith('data:') && (
            <div className="rounded-md border border-green-400/30 bg-green-400/10 p-3">
              <p className="mb-2 text-xs font-semibold text-green-300">
                ✓ Avatar Found in Blob
              </p>
              <div className="flex items-start gap-3">
                <img
                  src={blobData.profile.avatar}
                  alt="Avatar from Walrus"
                  className="h-20 w-20 rounded-full border-2 border-green-300 object-cover"
                />
                <div className="flex-1 text-xs text-gray-300">
                  <p>
                    <span className="font-semibold">Type:</span>{" "}
                    {blobData.profile.avatar.split(',')[0].split(':')[1].split(';')[0]}
                  </p>
                  <p>
                    <span className="font-semibold">Base64 Length:</span>{" "}
                    {blobData.profile.avatar.split(',')[1]?.length.toLocaleString() || 0} chars
                  </p>
                  <p>
                    <span className="font-semibold">Est. Size:</span>{" "}
                    {Math.round((blobData.profile.avatar.split(',')[1]?.length || 0) * 0.75 / 1024)} KB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Data */}
          <div className="rounded-md border border-blue-400/30 bg-blue-400/10 p-3">
            <p className="mb-2 text-xs font-semibold text-blue-300">
              Profile Data
            </p>
            <div className="space-y-1 text-xs text-gray-300">
              <p><span className="font-semibold">Name:</span> {blobData.profile?.name}</p>
              <p><span className="font-semibold">Bio:</span> {blobData.profile?.bio || 'N/A'}</p>
              <p><span className="font-semibold">GitHub:</span> {blobData.profile?.github || 'N/A'}</p>
              <p><span className="font-semibold">LinkedIn:</span> {blobData.profile?.linkedin || 'N/A'}</p>
              <p><span className="font-semibold">Website:</span> {blobData.profile?.website || 'N/A'}</p>
            </div>
          </div>

          {/* Raw JSON */}
          <details className="rounded-md border border-gray-400/30 bg-gray-400/10 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-gray-300">
              View Raw JSON
            </summary>
            <pre className="mt-2 max-h-96 overflow-auto rounded bg-black/50 p-2 text-xs text-gray-200">
              {JSON.stringify(
                {
                  ...blobData,
                  profile: {
                    ...blobData.profile,
                    avatar: blobData.profile?.avatar?.startsWith('data:')
                      ? `${blobData.profile.avatar.slice(0, 100)}... (truncated, full length: ${blobData.profile.avatar.length})`
                      : blobData.profile?.avatar
                  }
                },
                null,
                2
              )}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

