import type { APIRoute } from 'astro';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/bcs';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';

export const prerender = false;

type ExecuteBody = {
  txBytes: string; // base64 transaction bytes (onlyTransactionKind recommended)
  userSignature: string; // base64 SerializedSignature from user's wallet
  sender: string; // user's address (0x...)
};

const REQUIRED_ENVS = [
  // SUI_RPC_URL is optional (fallback to testnet)
  'SPONSOR_PRIVATE_KEY',
  'SPONSOR_ADDRESS',
];

function readEnv(name: string): string | undefined {
  if (typeof process !== 'undefined' && (process as any).env && (process as any).env[name] !== undefined) {
    return (process as any).env[name] as string | undefined;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[name] !== undefined) {
    return (import.meta as any).env[name] as string | undefined;
  }
  return undefined;
}

function assertEnvs() {
  const missing = REQUIRED_ENVS.filter((k) => !readEnv(k));
  if (missing.length) {
    throw new Error(`Missing required envs: ${missing.join(', ')}`);
  }
}

function getClient() {
  const url = readEnv('SUI_RPC_URL') || getFullnodeUrl('testnet');
  return new SuiClient({ url });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    assertEnvs();

    const body = (await request.json()) as ExecuteBody;
    const { txBytes, userSignature, sender } = body || {};

    if (!txBytes || !userSignature || !sender) {
      return new Response(
        JSON.stringify({ error: 'Missing txBytes, userSignature or sender' }),
        { status: 400 }
      );
    }

    const sponsorAddress = readEnv('SPONSOR_ADDRESS') as string;
    const sponsorSk = readEnv('SPONSOR_PRIVATE_KEY') as string;

    const client = getClient();

    // 1) Recreate transaction from user-provided onlyTransactionKind bytes
    const tx = Transaction.fromKind(txBytes);

    // 2) Enforce sender (user) and set sponsor as gas owner
    tx.setSender(sender);
    tx.setGasOwner(sponsorAddress);

    // 3) Select sponsor's SUI coin(s) for gas
    const coins = await client.getCoins({ owner: sponsorAddress, limit: 10 });
    if (!coins.data.length) {
      return new Response(JSON.stringify({ error: 'Sponsor has no SUI coins' }), { status: 500 });
    }

    const gasPayments = coins.data.slice(0, 1).map((c) => ({
      objectId: c.coinObjectId,
      digest: c.digest,
      version: c.version,
    }));
    tx.setGasPayment(gasPayments);

    // 4) Gas price & budget
    const refPrice = await client.getReferenceGasPrice();
    tx.setGasPrice(refPrice);
    // Simple default budget; adjust based on your tx complexity if needed
    tx.setGasBudget(2_000_000n);

    // 5) Build full transaction bytes (with gas)
    const fullTxBytes = await tx.build({ client });

    // 6) Create sponsor signature over the full transaction
    let sponsorKeypair: Ed25519Keypair;
    if (sponsorSk.startsWith('suiprivkey')) {
      const parsed = decodeSuiPrivateKey(sponsorSk);
      sponsorKeypair = Ed25519Keypair.fromSecretKey(parsed.secretKey);
    } else {
      sponsorKeypair = Ed25519Keypair.fromSecretKey(fromBase64(sponsorSk));
    }
    const { signature: sponsorSignature } = await sponsorKeypair.signTransaction(fullTxBytes);

    // 7) Execute with both signatures
    const exec = await client.executeTransactionBlock({
      transactionBlock: fullTxBytes,
      signature: [userSignature, sponsorSignature],
      options: { showEffects: true, showEvents: true },
    });

    return new Response(JSON.stringify(exec), { status: 200 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500 }
    );
  }
};


