import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import { uploadJson, fetchJson } from '../../lib/walrus';
import { getDevIdByUsername } from '../../lib/sui-views';
import { makeRegisterTx, makeUpdateProfileTx } from '../../lib/sui-tx';
import { Button } from '../shared/Button';

type ProfileData = {
  profile: {
    name?: string;
    bio?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    avatar?: string;
  };
  projects: any[];
  certificates: any[];
};

const EMPTY: ProfileData = {
  profile: {
    name: 'Tuan Anh',
    github: 'https://github.com/teededung',
    linkedin: 'https://www.linkedin.com/in/tuan-anh-nguyen-990140157/',
    website: 'Website',
    avatar: 'https://avatars.githubusercontent.com/u/9781158?v=4',
    bio: 'test bio',
  },
  projects: [],
  certificates: [],
};

export function OnchainProfileForm({ username }: { username: string }) {
  const account = useCurrentAccount();
  const [loading, setLoading] = useState(false);
  const [initialBlobId, setInitialBlobId] = useState<string | null>(null);
  const [data, setData] = useState<ProfileData>(EMPTY);
  const [message, setMessage] = useState<string | null>(null);
  const { mutateAsync: signAndExecute } = (useSignAndExecuteTransaction as any)();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const devId = await getDevIdByUsername(username);
        if (!devId) return;
        // fetch current dev object to read walrus_blob_id
        // We can rely on fetchJson once blob id known via page/view layer; for simplicity, leave it to parent or next step.
      } catch (e) {
        // ignore
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
      setMessage('Profile updated on-chain successfully (non-gasless).');
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
      <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Profile On-chain'}</Button>
      {message && <div className="text-sm opacity-80">{message}</div>}
      {initialBlobId && <div className="text-xs opacity-60">Current blobId: {initialBlobId}</div>}
    </form>
  );
}

export default OnchainProfileForm;


