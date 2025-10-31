import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { fromBase64 } from '@mysten/bcs';
import { uploadJson, fetchJson } from '../../lib/walrus';
import { getDevIdByUsername } from '../../lib/sui-views';
import { makeRegisterTx, makeUpdateProfileTx } from '../../lib/sui-tx';
import { Button } from '../shared/Button';
import type { DeveloperWalrus } from '../../types/developer';

const EMPTY: DeveloperWalrus = {
  profile: {
    name: '',
    github: '',
    linkedin: '',
    website: '',
    avatar: '',
    bio: '',
  },
  projects: [],
  certificates: [],
};

export function OnchainProfileForm({ username }: { username: string }) {
  const account = useCurrentAccount();
  const [loading, setLoading] = useState(false);
  const [initialBlobId, setInitialBlobId] = useState<string | null>(null);
  const [data, setData] = useState<DeveloperWalrus>(EMPTY);
  const [message, setMessage] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const { mutateAsync: signAndExecute } = (useSignAndExecuteTransaction as any)();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setMessage(null);
        setOwner(null);
        setInitialBlobId(null);
        const devId = await getDevIdByUsername(username);
        if (!devId) {
          setData(EMPTY);
          return;
        }
        const client = new SuiClient({ url: getFullnodeUrl('testnet') });
        const res = await client.getObject({ id: devId, options: { showContent: true } });
        const fields: any = (res.data as any)?.content?.fields;
        const ownerAddr: string | undefined = typeof fields?.owner === 'string' ? fields.owner : undefined;
        if (ownerAddr) setOwner(ownerAddr);
        let blobId: string | undefined;
        const raw = fields?.walrus_blob_id;
        if (typeof raw === 'string') {
          try {
            const bytes = raw.startsWith('0x')
              ? new Uint8Array(raw.slice(2).match(/.{1,2}/g)?.map((h: string) => parseInt(h, 16)) || [])
              : fromBase64(raw);
            blobId = new TextDecoder().decode(bytes);
          } catch {
            blobId = raw;
          }
        } else if (Array.isArray(raw)) {
          blobId = new TextDecoder().decode(new Uint8Array(raw));
        }
        if (!blobId) {
          setData(EMPTY);
          return;
        }
        setInitialBlobId(blobId);
        const json = await fetchJson<DeveloperWalrus>(blobId);
        const merged: DeveloperWalrus = {
          profile: {
            name: json?.profile?.name || '',
            github: json?.profile?.github || '',
            linkedin: json?.profile?.linkedin || '',
            website: json?.profile?.website || '',
            avatar: json?.profile?.avatar || '',
            bio: json?.profile?.bio || '',
          },
          projects: Array.isArray(json?.projects) ? json.projects : [],
          certificates: Array.isArray(json?.certificates) ? json.certificates : [],
        };
        setData(merged);
      } catch (e) {
        // ignore prefill errors
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account) {
      setMessage('Please connect your wallet.');
      return;
    }
    try {
      setLoading(true);
      setMessage(null);

      // 1) Upload merged JSON to Walrus
      const { blobId } = await uploadJson(data);

      // 2) Determine register or update
      const devId = await getDevIdByUsername(username);
      const sender = account.address;
      let txForWallet;
      if (!devId) {
        txForWallet = makeRegisterTx({ username, blobId, sender });
      } else {
        txForWallet = makeUpdateProfileTx({ devObjectId: devId, blobId, sender });
      }
      const exec = await signAndExecute({ transaction: txForWallet });
      if (!(exec as any)?.digest) throw new Error('execute failed');
      setMessage('Profile updated onchain successfully (non-gasless).');
      setInitialBlobId(blobId);
    } catch (err: any) {
      setMessage(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          placeholder="Name"
          className="rounded bg-white/10 px-3 py-2"
          value={data.profile.name || ''}
          onChange={(e) => setData((d) => ({ ...d, profile: { ...d.profile, name: e.target.value } }))}
        />
        <input
          placeholder="GitHub URL"
          className="rounded bg-white/10 px-3 py-2"
          value={data.profile.github || ''}
          onChange={(e) => setData((d) => ({ ...d, profile: { ...d.profile, github: e.target.value } }))}
        />
        <input
          placeholder="LinkedIn URL"
          className="rounded bg-white/10 px-3 py-2"
          value={data.profile.linkedin || ''}
          onChange={(e) => setData((d) => ({ ...d, profile: { ...d.profile, linkedin: e.target.value } }))}
        />
        <input
          placeholder="Website"
          className="rounded bg-white/10 px-3 py-2"
          value={data.profile.website || ''}
          onChange={(e) => setData((d) => ({ ...d, profile: { ...d.profile, website: e.target.value } }))}
        />
        <input
          placeholder="Avatar URL"
          className="rounded bg-white/10 px-3 py-2"
          value={data.profile.avatar || ''}
          onChange={(e) => setData((d) => ({ ...d, profile: { ...d.profile, avatar: e.target.value } }))}
        />
      </div>
      <textarea
        placeholder="Bio"
        className="w-full rounded bg-white/10 px-3 py-2"
        value={data.profile.bio || ''}
        onChange={(e) => setData((d) => ({ ...d, profile: { ...d.profile, bio: e.target.value } }))}
      />
      <Button
        type="submit"
        disabled={
          loading || !account || (owner !== null && account.address.toLowerCase() !== owner.toLowerCase())
        }
      >
        {loading ? 'Saving...' : 'Save Profile Onchainly'}
      </Button>
      {!account && (
        <div className="text-sm opacity-80">Please connect your wallet to save.</div>
      )}
      {account && owner !== null && account.address.toLowerCase() !== owner.toLowerCase() && (
        <div className="text-sm opacity-80">Connected wallet is not the owner of this profile.</div>
      )}
      {message && <div className="text-sm opacity-80">{message}</div>}
      {initialBlobId && <div className="text-xs opacity-60">Current blobId: {initialBlobId}</div>}
    </form>
  );
}

export default OnchainProfileForm;


