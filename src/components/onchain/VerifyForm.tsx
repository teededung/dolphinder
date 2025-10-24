import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { getDevIdByUsername } from '../../lib/sui-views';
import { Transaction } from '@mysten/sui/transactions';
import { Button } from '../shared/Button';

function getEnv(name: string): string | undefined {
  // @ts-ignore
  return (import.meta as any).env?.[name] || (process as any)?.env?.[name];
}

const PACKAGE_ID = getEnv('PACKAGE_ID')!;
const ADMIN_CAP_ID = getEnv('ADMIN_CAP_ID')!;

export default function VerifyForm() {
  const account = useCurrentAccount();
  const [username, setUsername] = useState('');
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
      const devId = await getDevIdByUsername(username);
      if (!devId) throw new Error('Developer not found');

      const tx = new Transaction();
      tx.setSender(account.address);
      tx.moveCall({
        target: `${PACKAGE_ID}::registry::set_verification`,
        arguments: [tx.object(devId), tx.pure.bool(true), tx.object(ADMIN_CAP_ID)],
      });
      const txBytes = await tx.build({ onlyTransactionKind: true });
      const { toBase64 } = await import('@mysten/bcs');
      const txB64 = toBase64(txBytes);
      const signRes = await (window as any).suiSign?.(txB64);
      const userSignature: string = signRes?.signature;
      if (!userSignature) throw new Error('Wallet signature missing');
      const resp = await fetch('/api/sponsor/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ txBytes: txB64, userSignature, sender: account.address }),
      });
      const out = await resp.json();
      if (!resp.ok) throw new Error(out?.error || 'Sponsor execute failed');
      setMsg('Verified successfully.');
    } catch (err: any) {
      setMsg(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input className="w-full rounded bg-white/10 px-3 py-2" placeholder="Username" value={username}
             onChange={(e) => setUsername(e.target.value)} />
      <Button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</Button>
      {msg && <div className="text-sm opacity-80">{msg}</div>}
    </form>
  );
}


