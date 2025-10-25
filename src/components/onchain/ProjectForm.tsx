import { useCurrentAccount } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { uploadJson, fetchJson } from '../../lib/walrus';
import { getDevIdByUsername } from '../../lib/sui-views';
import { buildRegisterTx, buildUpdateProfileTx } from '../../lib/sui-tx';
import { Button } from '../shared/Button';

type Project = {
  name: string;
  description?: string;
  repoUrl?: string;
  demoUrl?: string;
  tags?: string[];
};

export function ProjectForm({ username }: { username: string }) {
  const account = useCurrentAccount();
  const [project, setProject] = useState<Project>({ name: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setOwner(null);
        const devId = await getDevIdByUsername(username);
        if (!devId) return;
        const client = new SuiClient({ url: getFullnodeUrl('testnet') });
        const res = await client.getObject({ id: devId, options: { showContent: true } });
        const fields: any = (res.data as any)?.content?.fields;
        const ownerAddr: string | undefined = typeof fields?.owner === 'string' ? fields.owner : undefined;
        if (ownerAddr) setOwner(ownerAddr);
      } catch {
        // ignore
      }
    })();
  }, [username]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account) {
      setMsg('Please connect your wallet.');
      return;
    }
    try {
      setLoading(true);
      setMsg(null);

      // Load current JSON if exists
      let current: any = { profile: {}, projects: [], certificates: [] };
      // Optional: parent can pass current blobId to avoid extra fetch
      // For simplicity we skip fetch step here.

      current.projects = Array.isArray(current.projects) ? current.projects : [];
      current.projects.push(project);

      const { blobId } = await uploadJson(current);
      const devId = await getDevIdByUsername(username);
      const sender = account.address;
      let txBytes: string;
      if (!devId) {
        txBytes = await buildRegisterTx({ username, blobId, sender });
      } else {
        txBytes = await buildUpdateProfileTx({ devObjectId: devId, blobId, sender });
      }
      const signRes = await (window as any).suiSign?.(txBytes);
      const userSignature: string = signRes?.signature;
      if (!userSignature) throw new Error('Wallet signature missing');
      const resp = await fetch('/api/sponsor/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ txBytes, userSignature, sender }),
      });
      const out = await resp.json();
      if (!resp.ok) throw new Error(out?.error || 'Sponsor execute failed');
      setMsg('Project added on-chain.');
    } catch (err: any) {
      setMsg(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input className="w-full rounded bg-white/10 px-3 py-2" placeholder="Project name" value={project.name}
             onChange={(e) => setProject((p) => ({ ...p, name: e.target.value }))} />
      <input className="w-full rounded bg-white/10 px-3 py-2" placeholder="Repo URL" value={project.repoUrl || ''}
             onChange={(e) => setProject((p) => ({ ...p, repoUrl: e.target.value }))} />
      <input className="w-full rounded bg-white/10 px-3 py-2" placeholder="Demo URL" value={project.demoUrl || ''}
             onChange={(e) => setProject((p) => ({ ...p, demoUrl: e.target.value }))} />
      <textarea className="w-full rounded bg-white/10 px-3 py-2" placeholder="Description" value={project.description || ''}
                onChange={(e) => setProject((p) => ({ ...p, description: e.target.value }))} />
      <Button
        type="submit"
        disabled={
          loading || !account || (owner !== null && account.address.toLowerCase() !== owner.toLowerCase())
        }
      >
        {loading ? 'Saving...' : 'Add Project On-chain'}
      </Button>
      {!account && (<div className="text-sm opacity-80">Please connect your wallet to add project.</div>)}
      {account && owner !== null && account.address.toLowerCase() !== owner.toLowerCase() && (
        <div className="text-sm opacity-80">Connected wallet is not the owner of this profile.</div>
      )}
      {msg && <div className="text-sm opacity-80">{msg}</div>}
    </form>
  );
}

export default ProjectForm;


