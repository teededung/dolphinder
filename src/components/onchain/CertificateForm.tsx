import { useCurrentAccount } from '@mysten/dapp-kit';
import { useState } from 'react';
import { uploadJson } from '../../lib/walrus';
import { getDevIdByUsername } from '../../lib/sui-views';
import { buildRegisterTx, buildUpdateProfileTx } from '../../lib/sui-tx';
import { Button } from '../shared/Button';

type Certificate = {
  title: string;
  issuer?: string;
  date?: string;
  url?: string;
  credentialId?: string;
};

export function CertificateForm({ username }: { username: string }) {
  const account = useCurrentAccount();
  const [cert, setCert] = useState<Certificate>({ title: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account) {
      setMsg('Please connect your wallet.');
      return;
    }
    try {
      setLoading(true);
      setMsg(null);

      let current: any = { profile: {}, projects: [], certificates: [] };
      current.certificates = Array.isArray(current.certificates) ? current.certificates : [];
      current.certificates.push(cert);

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
      setMsg('Certificate added on-chain.');
    } catch (err: any) {
      setMsg(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input className="w-full rounded bg-white/10 px-3 py-2" placeholder="Title" value={cert.title}
             onChange={(e) => setCert((p) => ({ ...p, title: e.target.value }))} />
      <input className="w-full rounded bg-white/10 px-3 py-2" placeholder="Issuer" value={cert.issuer || ''}
             onChange={(e) => setCert((p) => ({ ...p, issuer: e.target.value }))} />
      <input className="w-full rounded bg-white/10 px-3 py-2" placeholder="Date" value={cert.date || ''}
             onChange={(e) => setCert((p) => ({ ...p, date: e.target.value }))} />
      <input className="w-full rounded bg-white/10 px-3 py-2" placeholder="URL" value={cert.url || ''}
             onChange={(e) => setCert((p) => ({ ...p, url: e.target.value }))} />
      <input className="w-full rounded bg-white/10 px-3 py-2" placeholder="Credential ID" value={cert.credentialId || ''}
             onChange={(e) => setCert((p) => ({ ...p, credentialId: e.target.value }))} />
      <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Certificate On-chain'}</Button>
      {msg && <div className="text-sm opacity-80">{msg}</div>}
    </form>
  );
}

export default CertificateForm;


