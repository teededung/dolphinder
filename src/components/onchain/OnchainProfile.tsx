import { useEffect, useState } from 'react';
import { getDevIdByUsername } from '../../lib/sui-views';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { fromBase64 } from '@mysten/bcs';
import { fetchJson } from '../../lib/walrus';
import ProfileCard from '../shared/ProfileCard';

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
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const devId = await getDevIdByUsername(username);
        if (!devId) {
          setData(null);
          setIsVerified(null);
          const el = document.getElementById('static-profile');
          if (el) el.style.removeProperty('display');
          return;
        }
        const client = new SuiClient({ url: getFullnodeUrl('testnet') });
        const res = await client.getObject({ id: devId, options: { showContent: true } });
        const fields: any = (res.data as any)?.content?.fields;
        const verifiedFlag: boolean | undefined = typeof fields?.is_verified === 'boolean' ? fields.is_verified : undefined;
        const ownerAddr: string | undefined = typeof fields?.owner === 'string' ? fields.owner : undefined;
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
          setIsVerified(null);
          const el2 = document.getElementById('static-profile');
          if (el2) el2.style.removeProperty('display');
          return;
        }
        const json = await fetchJson<OnchainData>(blobId);
        console.log(json);

        setData(json);
        setIsVerified(verifiedFlag ?? null);
        if (ownerAddr) setOwner(ownerAddr);
        // hide static fallback card when on-chain data exists
        const el3 = document.getElementById('static-profile');
        if (el3) el3.style.setProperty('display', 'none');

        // avatar from on-chain json
        const maybeAvatar = json?.profile?.avatar;
        if (typeof maybeAvatar === 'string' && maybeAvatar.length > 0) {
          setAvatar(maybeAvatar);
        }
      } catch (e: any) {
        setError(String(e?.message || e));
        setIsVerified(null);
        const el4 = document.getElementById('static-profile');
        if (el4) el4.style.removeProperty('display');
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  if (loading) return <div className="opacity-70">Loading on-chain profile...</div>;
  if (error) return null; // show static profile fallback
  if (!data) return null; // show static profile fallback

  return (
    <ProfileCard
      variant="onchain"
      name={data.profile?.name}
      avatar={avatar || undefined}
      bio={data.profile?.bio}
      github={data.profile?.github}
      linkedin={data.profile?.linkedin}
      website={data.profile?.website}
      walletAddress={owner || undefined}
      isVerified={isVerified ?? undefined}
    />
  );
}

export default OnchainProfile;


