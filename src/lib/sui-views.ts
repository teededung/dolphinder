import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { fromBase64 } from '@mysten/bcs';
import { Transaction } from '@mysten/sui/transactions';

function getEnv(name: string): string | undefined {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[name] !== undefined) {
    return (import.meta as any).env[name] as string | undefined;
  }
  if (typeof process !== 'undefined' && (process as any).env && (process as any).env[name] !== undefined) {
    return (process as any).env[name] as string | undefined;
  }
  return undefined;
}

const RPC_URL = getEnv('SUI_RPC_URL') || getFullnodeUrl('testnet');
const PACKAGE_ID = (import.meta as any).env.PUBLIC_PACKAGE_ID as string | undefined ?? getEnv('PACKAGE_ID');
const USERNAME_INDEX_ID = (import.meta as any).env.PUBLIC_USERNAME_INDEX_ID as string | undefined ?? getEnv('USERNAME_INDEX_ID');

const client = new SuiClient({ url: RPC_URL });

/**
 * devInspect call to get developer object ID by username using the on-chain view function.
 * Returns objectId as hex string or null if not found.
 */
export async function getDevIdByUsername(username: string): Promise<string | null> {
  if (!PACKAGE_ID || !USERNAME_INDEX_ID) throw new Error('Missing PACKAGE_ID or USERNAME_INDEX_ID');

  // Prepare Move function and arguments
  const target = `${PACKAGE_ID}::registry::get_dev_id_by_username`;

  // Encode username as vector<u8>
  const usernameBytes = new TextEncoder().encode(username);

  const tx = new Transaction();
  tx.moveCall({
    target,
    arguments: [
      tx.object(USERNAME_INDEX_ID),
      tx.pure.vector('u8', Array.from(usernameBytes)),
    ],
  });

  const ZERO = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const res = await client.devInspectTransactionBlock({
    sender: ZERO,
    transactionBlock: tx,
  });

  // Parse return value (ID). Some nodes return base64 string, others number[]
  const r0 = (res as any).results?.[0];
  const returnValues = r0?.returnValues as [unknown, string][] | undefined;
  if (!returnValues || !returnValues.length) return null;

  const [raw] = returnValues[0];
  let idBytes: Uint8Array | null = null;
  if (typeof raw === 'string') {
    try {
      idBytes = fromBase64(raw);
    } catch {
      idBytes = null;
    }
  } else if (Array.isArray(raw)) {
    idBytes = new Uint8Array(raw as number[]);
  }
  if (!idBytes) return null;

  const hex = '0x' + Array.from(idBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex;
}


