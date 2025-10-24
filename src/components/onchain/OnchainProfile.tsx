import { useEffect, useState } from 'react';
import { getDevIdByUsername } from '../../lib/sui-views';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { fromBase64 } from '@mysten/bcs';
import { fetchJson } from '../../lib/walrus';

type OnchainData = {
  profile?: {
    name?: string;
    bio?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    avatar?: string;
  };
  projects?: any[];
  certificates?: any[];
};

export function OnchainProfile({ username }: { username: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OnchainData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const devId = await getDevIdByUsername(username);
        if (!devId) {
          setData(null);
          return;
        }
        const client = new SuiClient({ url: getFullnodeUrl('testnet') });
        const res = await client.getObject({ id: devId, options: { showContent: true } });
        const fields: any = (res.data as any)?.content?.fields;
        // walrus_blob_id is vector<u8> on-chain; decode to ASCII string
        let blobId: string | undefined;
        const raw = fields?.walrus_blob_id;
        if (typeof raw === 'string') {
          try {
            const bytes = raw.startsWith('0x')
              ? new Uint8Array(raw.slice(2).match(/.{1,2}/g)?.map((h: string) => parseInt(h, 16)) || [])
              : fromBase64(raw);
            blobId = new TextDecoder().decode(bytes);
          } catch {
            blobId = raw; // fallback
          }
        } else if (Array.isArray(raw)) {
          blobId = new TextDecoder().decode(new Uint8Array(raw));
        }
        if (!blobId) {
          setData(null);
          return;
        }
        const json = await fetchJson<OnchainData>(blobId);
        setData(json);
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  if (loading) return <div className="opacity-70">Loading on-chain profile...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!data) return <div className="opacity-70">No on-chain profile found.</div>;

  return (
    <div className="space-y-3">
      {data.profile?.name && <div className="text-2xl font-semibold">{data.profile.name}</div>}
      {data.profile?.bio && <p className="opacity-80">{data.profile.bio}</p>}
      <div className="space-x-3">
        {data.profile?.github && <a className="underline" href={data.profile.github} target="_blank">GitHub</a>}
        {data.profile?.linkedin && <a className="underline" href={data.profile.linkedin} target="_blank">LinkedIn</a>}
        {data.profile?.website && <a className="underline" href={data.profile.website} target="_blank">Website</a>}
      </div>
    </div>
  );
}

export default OnchainProfile;


