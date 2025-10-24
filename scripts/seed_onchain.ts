/**
 * Optional seed script:
 * - Reads static developers from src/data/developers
 * - Upload minimal JSON to Walrus
 * - Builds register txBytes for each (username, blobId)
 * - Prints payload for manual signing & sponsor POST
 *
 * Run with: node --loader ts-node/esm scripts/seed_onchain.ts (if ts-node installed)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { uploadJson } from '../src/lib/walrus';
import { buildRegisterTx } from '../src/lib/sui-tx';

async function main() {
  const dir = resolve(process.cwd(), 'src/data/developers');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const raw = readFileSync(resolve(dir, f), 'utf8');
    const dev = JSON.parse(raw);
    const username: string = dev.username;
    const minimal = { profile: dev, projects: [], certificates: [] };
    const { blobId } = await uploadJson(minimal);
    // sender should be the developer's wallet, unknown here; print txBytes for manual use
    const txBytes = await buildRegisterTx({ username, blobId, sender: '0xDEADBEEF' });
    console.log(`${username}: blobId=${blobId}`);
    console.log(`txBytes=${txBytes}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


