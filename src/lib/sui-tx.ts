import { Transaction } from '@mysten/sui/transactions';
import { toBase64 } from '@mysten/bcs';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

function getEnv(name: string): string | undefined {
  // @ts-ignore - import.meta.env injected by Vite/Astro
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[name] !== undefined) {
    // @ts-ignore
    return (import.meta as any).env[name];
  }
  // Node runtime (API routes)
  // @ts-ignore
  if (typeof process !== 'undefined' && (process as any).env && (process as any).env[name] !== undefined) {
    // @ts-ignore
    return (process as any).env[name];
  }
  return undefined;
}

const RPC_URL = getEnv('SUI_RPC_URL') || getFullnodeUrl('testnet');
const PACKAGE_ID = (import.meta as any).env?.PUBLIC_PACKAGE_ID ?? getEnv('PACKAGE_ID')!;
const USERNAME_INDEX_ID = (import.meta as any).env?.PUBLIC_USERNAME_INDEX_ID ?? getEnv('USERNAME_INDEX_ID')!;

export function toBytesUtf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/**
 * Build a transaction for calling register (first-time profile creation)
 */
export async function buildRegisterTx(params: { username: string; blobId: string; sender: string }): Promise<string> {
  const { username, blobId, sender } = params;
  const tx = new Transaction();
  tx.setSender(sender);
  tx.moveCall({
    target: `${PACKAGE_ID}::registry::register`,
    arguments: [
      // Shared UsernameIndex will be resolved via client at build time
      tx.object(USERNAME_INDEX_ID),
      tx.pure.vector('u8', Array.from(toBytesUtf8(username))),
      tx.pure.vector('u8', Array.from(toBytesUtf8(blobId))),
      // Sui Clock shared object, resolved at build time
      tx.object('0x6'),
    ],
  });
  // Return onlyTransactionKind so user signs intent w/o gas
  const client = new SuiClient({ url: RPC_URL });
  const bytes = await tx.build({ onlyTransactionKind: true, client });
  return toBase64(bytes);
}

/**
 * Build a transaction for calling update_profile (existing developer)
 */
export async function buildUpdateProfileTx(params: { devObjectId: string; blobId: string; sender: string }): Promise<string> {
  const { devObjectId, blobId, sender } = params;
  const tx = new Transaction();
  tx.setSender(sender);
  tx.moveCall({
    target: `${PACKAGE_ID}::registry::update_profile`,
    arguments: [
      tx.object(devObjectId),
      tx.pure.vector('u8', Array.from(toBytesUtf8(blobId))),
      tx.object('0x6'),
    ],
  });
  const client = new SuiClient({ url: RPC_URL });
  const bytes = await tx.build({ onlyTransactionKind: true, client });
  return toBase64(bytes);
}

// Helpers that return Transaction objects (for wallet signing API)
export function makeRegisterTx(params: { username: string; blobId: string; sender: string }): Transaction {
  const { username, blobId, sender } = params;
  const tx = new Transaction();
  tx.setSender(sender);
  tx.moveCall({
    target: `${PACKAGE_ID}::registry::register`,
    arguments: [
      tx.object(USERNAME_INDEX_ID),
      tx.pure.vector('u8', Array.from(toBytesUtf8(username))),
      tx.pure.vector('u8', Array.from(toBytesUtf8(blobId))),
      tx.object('0x6'),
    ],
  });
  return tx;
}

export function makeUpdateProfileTx(params: { devObjectId: string; blobId: string; sender: string }): Transaction {
  const { devObjectId, blobId, sender } = params;
  const tx = new Transaction();
  tx.setSender(sender);
  tx.moveCall({
    target: `${PACKAGE_ID}::registry::update_profile`,
    arguments: [
      tx.object(devObjectId),
      tx.pure.vector('u8', Array.from(toBytesUtf8(blobId))),
      tx.object('0x6'),
    ],
  });
  return tx;
}

export async function buildOnlyTransactionKindB64(tx: Transaction): Promise<string> {
  const client = new SuiClient({ url: RPC_URL });
  const bytes = await tx.build({ onlyTransactionKind: true, client });
  return toBase64(bytes);
}


