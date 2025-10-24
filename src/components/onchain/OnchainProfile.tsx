import { useEffect, useState } from 'react';
import { getDevIdByUsername } from '../../lib/sui-views';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { fromBase64 } from '@mysten/bcs';
import { fetchJson } from '../../lib/walrus';
import { Github, Linkedin, Globe } from 'lucide-react';

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
    <div className="space-y-3">
      {/* Badges row: On-chain + Verified (if any) */}
      <div className="flex justify-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-sm text-sky-300">
          <img src="/sui-sui-logo.svg" alt="Sui" className="h-4 w-4" />
          On-chain
        </span>
        {isVerified === true && (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-7 9.5a.75.75 0 01-1.127.075l-3.5-3.5a.75.75 0 011.06-1.06l2.894 2.893 6.48-8.788a.75.75 0 011.05-.172z" clipRule="evenodd" /></svg>
            Verified
          </span>
        )}
      </div>
      {avatar && (
        <div className="flex justify-center">
          <img src={avatar} alt={data.profile?.name || username} className="h-40 w-40 rounded-full object-cover border-4 border-white/20 shadow" />
        </div>
      )}
      {isVerified === false && (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-yellow-200">
          On-chain profile found, but the profile is not verified.
        </div>
      )}
      {data.profile?.name && <div className="text-2xl font-semibold">{data.profile.name}</div>}
      {data.profile?.bio && <p className="opacity-80">{data.profile.bio}</p>}
      <div className="flex justify-center space-x-4 mt-2">
        {data.profile?.github && (
          <a
            href={data.profile.github}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
          >
            <Github className="w-5 h-5" />
            <span>GitHub</span>
          </a>
        )}
        {data.profile?.linkedin && (
          <a
            href={data.profile.linkedin}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
          >
            <Linkedin className="w-5 h-5" />
            <span>LinkedIn</span>
          </a>
        )}
        {data.profile?.website && (
          <a
            href={data.profile.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
          >
            <Globe className="w-5 h-5" />
            <span>Website</span>
          </a>
        )}
      </div>
    </div>
  );
}

export default OnchainProfile;


