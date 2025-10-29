# 🐋 Walrus Storage Integration

Dolphinder integrates with Walrus decentralized storage to enable on-chain developer profiles on Sui blockchain.

## Overview

Walrus provides decentralized, permanent storage for profile data. Developers can optionally push their profiles to Walrus for verifiable on-chain presence.

### Key Features

- ✅ **Optional On-chain Storage**: Push profile to Walrus blockchain
- ✅ **Hybrid Data Loading**: Load from Supabase first, then verify from Walrus
- ✅ **Storage Metadata**: View epoch info, expiry, and storage size
- ✅ **Blockchain Verification**: Links to Suiscan and Walrus explorers
- ✅ **Badge System**: Visual indicators for on-chain vs off-chain profiles

## Architecture

### Data Flow

```
User Profile Update
    ↓
1. Save to Supabase (fast, off-chain)
    ↓
2. [Optional] Push to Walrus
    ↓
3. Upload JSON to Walrus Publisher
    ↓
4. Sign transaction with Sui wallet
    ↓
5. Store blob_id on Sui blockchain
    ↓
6. Cache blob_id + blob_object_id in Supabase
```

### Storage Model

**Off-chain (Supabase)**:

- Fast reads/writes
- Full profile data
- `walrus_blob_id`: NULL
- `blob_object_id`: NULL

**On-chain (Walrus + Sui)**:

- Decentralized storage
- Verifiable data
- `walrus_blob_id`: Content hash (for data retrieval)
- `blob_object_id`: Sui object ID (for metadata queries)

## Environment Setup

Add to `.env`:

```env
# Walrus Publisher (for uploads)
PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space

# Walrus Aggregator (for downloads)
PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# Sui Network
PUBLIC_SUI_NETWORK=testnet

# Developer Registry Contract
PUBLIC_REGISTRY_PACKAGE_ID=0xc6766915f7f8c8cf74821d9ee2f36bf089466782f4764373de31307ded80dfe5
PUBLIC_REGISTRY_INDEX_ID=0x4eab69ce7c3e0865c3f89369e78ee0fa43e08fc2c45fa4fca8d75c636b6b9f7f
```

## Database Schema

### New Columns

```sql
-- Content hash from Walrus (stored on-chain in smart contract)
ALTER TABLE developers
ADD COLUMN walrus_blob_id TEXT;

-- Sui object ID of the Blob (for querying storage metadata)
ALTER TABLE developers
ADD COLUMN blob_object_id TEXT;

CREATE INDEX idx_developers_walrus_blob_id ON developers(walrus_blob_id);
CREATE INDEX idx_developers_blob_object_id ON developers(blob_object_id);
```

## Smart Contract

Location: `move/developer_registry/sources/registry.move`

### Key Functions

**`register(username, walrus_blob_id)`**

- Creates new Developer object on Sui
- Stores username → blob_id mapping
- Emits `Registered` event

**`update_profile(dev, walrus_blob_id)`**

- Updates existing Developer's blob_id
- Only owner can update
- Emits `ProfileUpdated` event

**`get_dev_id_by_username(username)`**

- Query Developer object ID by username
- Used for on-chain verification

## User Flow

### 1. Push Profile to Walrus

From Dashboard → Edit Profile:

1. ✅ Update profile info normally
2. ✅ Check "Push to Walrus (Onchain Storage)"
3. ✅ Click "Save Changes"
4. ⏳ Uploading to Walrus... (2-5 seconds)
5. 💳 Wallet prompt appears → Sign transaction
6. ✅ Success! Profile now on-chain

### 2. View On-chain Status

Dashboard sidebar shows:

**When on-chain:**

- 🐋 **Walrus Badge** next to username
- **Storage Info** collapsible section:
  - Registered epoch
  - Storage period (start → end)
  - Duration (X epochs ~X days)
  - Storage size (KB)
  - Active status
- **Verification Links**:
  - Dev Profile → Suiscan
  - Blob Storage → Suiscan
  - Blob Data → Download JSON

**When off-chain:**

- 🗄️ **Offchain Badge**
- No storage info section

## Technical Details

### Walrus Upload

```typescript
// src/lib/walrus.ts
async function uploadJson(data, epochs = 2) {
  // Upload to Publisher
  const response = await fetch(`${PUBLISHER_URL}/v1/blobs?epochs=${epochs}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  const { blobId, blobObjectId } = await response.json();
  return { blobId, blobObjectId };
}
```

### Storage Duration

- Default: **3 epochs** (~3 days on testnet)
- Configurable in `uploadJson()` function
- Can be extended by re-pushing profile
- Publisher must have sufficient WAL tokens

### Blob Metadata Query

```typescript
// src/lib/walrus-metadata.ts
async function getBlobMetadata(blobObjectId) {
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });

  const response = await client.getObject({
    id: blobObjectId,
    options: { showContent: true },
  });

  return {
    registered_epoch: fields.registered_epoch,
    certified_epoch: fields.certified_epoch,
    storage: {
      start_epoch: fields.storage.start_epoch,
      end_epoch: fields.storage.end_epoch,
      storage_size: fields.storage.storage_size,
    },
  };
}
```

## UI Components

### WalrusStorageInfo Component

Location: `src/components/dashboard/WalrusStorageInfo.tsx`

**Features:**

- Collapsible section (default closed)
- Walrus icon header
- Active status indicator
- Epoch information display
- External verification links
- Clean, compact design

**Usage:**

```tsx
<WalrusStorageInfo
  blobMetadata={metadata}
  devId={devObjectId}
  walrusBlobId={contentHash}
  blobObjectId={suiObjectId}
/>
```

### WalrusBadge Component

Location: `src/components/shared/WalrusBadge.tsx`

**Variants:**

- `onchain`: Green with Walrus icon
- `offchain`: Orange with Database icon

**Sizes:** `sm`, `md`, `lg`

## Filtering & Discovery

### Developers Page

`/developers` includes filter:

- **All**: Show all developers
- **Walrus**: Only on-chain profiles

On-chain profiles are:

- Displayed with Walrus badge
- Prioritized in listing order
- Highlighted visually

## Limitations & Considerations

### Current Limitations

1. **Walrus Epochs != Sui Epochs**
   - Walrus has separate epoch system
   - Cannot directly query current Walrus epoch
   - Use blob metadata as reference point

2. **Storage Expiry**
   - Testnet: Short epochs (~1 day)
   - Must re-push periodically to extend
   - Data may become inaccessible after expiry

3. **Publisher Balance**
   - Public publisher has limited WAL tokens
   - Long storage periods (>5 epochs) may fail
   - Consider running own publisher for production

### Best Practices

1. **Keep Supabase as Source of Truth**
   - Always save to Supabase first
   - Walrus is optional verification layer
   - Load from Supabase → verify from Walrus

2. **Storage Duration**
   - Testnet: Use 2-5 epochs for testing
   - Mainnet: Consider longer periods (30-90 days)
   - Monitor expiry and remind users to renew

3. **Error Handling**
   - Walrus upload failure should not block profile update
   - Show clear error messages to users
   - Provide retry mechanism

## Troubleshooting

### "Walrus upload failed: insufficient balance"

**Cause**: Publisher node doesn't have enough WAL tokens for storage duration

**Solution**:

1. Reduce `epochs` parameter in `uploadJson()` (currently 2)
2. Use different publisher URL with more balance
3. Run your own publisher node

### "Could not find WalletContext"

**Cause**: Wallet provider not available in component

**Solution**:

- Ensure component is wrapped in `GlobalSuiProvider`
- Use `client:load` directive in Astro
- Check `OnchainProfileWrapper` is used for client-side rendering

### Blob metadata shows "Storage info unavailable"

**Cause**: `blob_object_id` not stored in database

**Solution**:

1. Re-push profile to Walrus
2. Verify API endpoint saves `blob_object_id`
3. Check migration `003_add_blob_object_id.sql` was applied

### Transaction fails to sign

**Cause**: Wallet not connected or wrong network

**Solution**:

1. Connect wallet via "Bind Sui Wallet" in Dashboard
2. Ensure wallet is on testnet
3. Check wallet has SUI for gas fees

## Future Improvements

### Planned Features

- [ ] Automatic storage renewal notifications
- [ ] Display days until expiry warning
- [ ] Wallet-paid storage (user provides WAL tokens)
- [ ] Mainnet deployment
- [ ] Storage cost calculator
- [ ] Batch upload for multiple profiles

### Possible Enhancements

- Store `blob_object_id` on-chain in smart contract
- Query current Walrus epoch via SDK
- Implement storage marketplace
- Support for profile history/versioning

## Resources

- [Walrus Documentation](https://docs.walrus.site/)
- [Walrus Testnet](https://walruscan.com/testnet)
- [Sui Documentation](https://docs.sui.io/)
- [Suiscan Explorer](https://suiscan.xyz/testnet)

---

**Integration Status**: ✅ Complete (Testnet)  
**Last Updated**: October 29, 2025
