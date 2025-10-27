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

export function OnchainProfile({ username, showEditButton }: { username: string; showEditButton?: boolean }) {
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
        
        // Load on-chain data in background
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
          return;
        }
        
        const json = await fetchJson<OnchainData>(blobId);
        console.log('[OnchainProfile] Loaded on-chain data:', json);

        setData(json);
        setIsVerified(verifiedFlag ?? null);
        if (ownerAddr) setOwner(ownerAddr);
        
        // Show on-chain profile and hide static profile with smooth transition
        const staticEl = document.getElementById('static-profile');
        const onchainEl = document.getElementById('onchain-profile');
        
        if (staticEl && onchainEl) {
          // Fade out static profile
          staticEl.style.transition = 'opacity 0.3s ease-out';
          staticEl.style.opacity = '0';
          
          setTimeout(() => {
            staticEl.style.display = 'none';
            onchainEl.style.removeProperty('display');
            // Fade in on-chain profile
            onchainEl.style.opacity = '0';
            onchainEl.style.transition = 'opacity 0.3s ease-in';
            setTimeout(() => {
              onchainEl.style.opacity = '1';
            }, 10);
          }, 300);
        }

        // avatar from on-chain json
        const maybeAvatar = json?.profile?.avatar;
        if (typeof maybeAvatar === 'string' && maybeAvatar.length > 0) {
          setAvatar(maybeAvatar);
        }
      } catch (e: any) {
        console.warn('[OnchainProfile] Failed to load on-chain data:', e?.message || e);
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
      avatar={avatar || undefined}
      bio={data.profile?.bio}
      github={data.profile?.github}
      linkedin={data.profile?.linkedin}
      website={data.profile?.website}
      walletAddress={owner || undefined}
      isVerified={isVerified ?? undefined}
      showEditButton={showEditButton}
    />
  );
}

export default OnchainProfile;


