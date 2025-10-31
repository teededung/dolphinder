import { useEffect, useState } from 'react';
import { getDevIdByUsername } from '../../lib/sui-views';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { fromBase64 } from '@mysten/bcs';
import { fetchJson } from '../../lib/walrus';
import ProfileCard from '../shared/ProfileCard.tsx';
import type { Project } from '../../types/project';

type OnchainData = {
  profile?: {
    name?: string;
    bio?: string;
    entry?: string; // Level/Role (e.g., Senior Developer, Newbie)
    github?: string;
    linkedin?: string;
    telegram?: string;
    website?: string;
    avatar?: string;
  };
  projects?: Project[]; // Use Project type from project.ts
  certificates?: Array<{
    name: string;
    issuer?: string;
    date?: string;
    url?: string;
  }>;
};

function OnchainProfile({ username, showEditButton }: { username: string; showEditButton?: boolean }) {
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
        
        // Load onchain data in background
        const devId = await getDevIdByUsername(username);
        if (!devId) {
          setData(null);
          setIsVerified(null);
          return;
        }
        
        const client = new SuiClient({ url: getFullnodeUrl('testnet') });
        const res = await client.getObject({ id: devId, options: { showContent: true } });
        const fields: any = (res.data as any)?.content?.fields;
        const verifiedFlag: boolean | undefined = typeof fields?.is_verified === 'boolean' ? fields.is_verified : undefined;
        const ownerAddr: string | undefined = typeof fields?.owner === 'string' ? fields.owner : undefined;
        
        // walrus_blob_id is vector<u8> onchain; decode to ASCII string
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
          return;
        }
        
        const json = await fetchJson<OnchainData>(blobId);
        console.log('[OnchainProfile] Loaded onchain data:', json);
        setData(json);
        setIsVerified(verifiedFlag ?? null);
        if (ownerAddr) setOwner(ownerAddr);
        
        // Show onchain profile and hide static profile instantly
        const staticEl = document.getElementById('static-profile');
        const onchainEl = document.getElementById('onchain-profile');
        
        if (staticEl && onchainEl) {
          staticEl.style.display = 'none';
          onchainEl.style.removeProperty('display');
        }

        // avatar from onchain json
        const maybeAvatar = json?.profile?.avatar;
        if (typeof maybeAvatar === 'string' && maybeAvatar.length > 0) {
          setAvatar(maybeAvatar);
        }
      } catch (e: any) {
        console.warn('[OnchainProfile] Failed to load onchain data:', e?.message || e);
        setError(String(e?.message || e));
        setIsVerified(null);
        // Keep showing static profile on error
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  // Don't render anything while loading or on error - static profile will show instead
  if (loading || error || !data) return null;

  return (
    <ProfileCard
      variant="onchain"
      name={data.profile?.name}
      username={username}
      avatar={avatar || undefined}
      bio={data.profile?.bio}
      entry={data.profile?.entry}
      github={data.profile?.github}
      linkedin={data.profile?.linkedin}
      telegram={data.profile?.telegram}
      website={data.profile?.website}
      walletAddress={owner || undefined}
      isVerified={isVerified ?? undefined}
      projects={data.projects}
      certificates={data.certificates}
      showEditButton={showEditButton}
    />
  );
}

export default OnchainProfile;
