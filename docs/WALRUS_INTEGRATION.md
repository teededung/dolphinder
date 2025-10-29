# Walrus Onchain Storage Integration

## Overview

This document describes the implementation of Walrus storage integration into the Dolphinder developer profiles system. Users can now optionally push their profiles to Walrus (Sui blockchain) for decentralized, censorship-resistant storage.

## Features Implemented

### 1. Database Schema Update

- Added `walrus_blob_id` column to `developers` table
- Nullable TEXT field to cache Walrus blob IDs
- Indexed for fast filtering and sorting

**Migration File**: `supabase/migrations/002_add_walrus_blob_id.sql`

### 2. TypeScript Type Updates

- Updated `Developer` interface to include `walrus_blob_id: string | null`
- Ensures type safety across the application

**Modified File**: `src/lib/auth.ts`

### 3. Profile Form Integration

Users can now push their profile to Walrus directly from the Edit Profile page:

**Features:**

- Optional checkbox to enable Walrus push
- Requires bound Sui wallet
- Shows existing blob ID if already onchain
- Transaction flow:
  1. Save profile to Supabase (offchain)
  2. If checkbox enabled: Upload JSON to Walrus
  3. Create blockchain transaction (register or update)
  4. Sign with wallet and execute
  5. Update Supabase with blob_id

**Modified File**: `src/components/shared/ProfileForm.tsx`

**Key Functions:**

- `handleWalrusPush()`: Handles the complete push flow
- Imports from `lib/walrus.ts`, `lib/sui-views.ts`, `lib/sui-tx.ts`

### 4. API Endpoint for Walrus Push

New backend endpoint to validate and store blob IDs:

**Endpoint**: `POST /api/profile/push-walrus`

**Input:**

```json
{
  "profileData": { "blobId": "..." },
  "txDigest": "0x..."
}
```

**Validation:**

- Checks authentication
- Verifies wallet is bound
- Confirms transaction succeeded onchain
- Updates `walrus_blob_id` in Supabase

**New File**: `src/pages/api/profile/push-walrus.ts`

### 5. Developers Page Filter & Highlight

Complete redesign with filtering and visual distinction:

**Features:**

- Filter buttons: All / Onchain / Offchain
- Auto-sort: Onchain profiles appear first
- Visual highlight: Emerald theme for onchain cards
- Badge indicator: "Onchain" with Sui logo
- Responsive design

**Modified Files:**

- `src/pages/developers.astro` - Uses new filter component
- `src/components/DevelopersFilter.tsx` - New React component with state management

### 6. Developer Showcase Enhancement

Homepage showcase now displays onchain badges:

**Features:**

- Fetches from Supabase (includes `walrus_blob_id`)
- Mini "On" badge on onchain profiles
- Emerald color scheme for onchain cards
- Different hover effects

**Modified Files:**

- `src/components/DeveloperShowcase.tsx`
- `src/pages/api/developers/list.ts` (new endpoint)

## User Flow

### For Developers

1. **Register/Login** → GitHub OAuth
2. **Edit Profile** → Fill in details
3. **Bind Wallet** → Connect Sui wallet (testnet)
4. **Optional: Push to Walrus**
   - Check "Push to Walrus" checkbox
   - Click "Save Changes"
   - Confirm wallet transaction (~0.01 SUI fee)
   - Profile is now onchain!
5. **Result**: Profile displays "Onchain" badge

### For Visitors

1. Visit `/developers` page
2. See filter buttons: All / Onchain / Offchain
3. Onchain profiles show emerald theme + badge
4. Click filter to toggle views
5. Onchain profiles prioritized at top

## Technical Details

### Data Structure (Walrus JSON)

```json
{
  "profile": {
    "name": "Developer Name",
    "bio": "Bio text",
    "github": "https://github.com/...",
    "linkedin": "https://linkedin.com/...",
    "website": "https://...",
    "avatar": "https://..."
  },
  "projects": [],
  "certificates": []
}
```

### Blockchain Flow

1. **Upload to Walrus** → Get `blobId`
2. **Check if registered** → `getDevIdByUsername()`
3. **Create transaction**:
   - If not registered: `makeRegisterTx(username, blobId, sender)`
   - If already registered: `makeUpdateProfileTx(devObjectId, blobId, sender)`
4. **Sign & Execute** → `signAndExecuteTransaction()`
5. **Update Supabase** → Store `blobId` for caching

### Why Cache blob_id in Supabase?

- **Performance**: Fast filtering without blockchain queries
- **UX**: Instant badge display
- **Reliability**: Fallback if blockchain query fails
- **Filtering**: Enable efficient SQL queries for onchain/offchain

## Environment Variables Required

Ensure these are set in your environment:

```bash
# Walrus
PUBLIC_WALRUS_PUBLISHER_URL=https://...
PUBLIC_WALRUS_AGGREGATOR_URL=https://...

# Sui
PUBLIC_SUI_NETWORK=testnet
PACKAGE_ID=0x...
```

## Migration Steps

To apply the database changes:

```bash
# Local development with Supabase CLI
supabase db push

# Or manually run the migration
psql -f supabase/migrations/002_add_walrus_blob_id.sql
```

## Testing Checklist

- [ ] Edit profile without Walrus push (should work as before)
- [ ] Edit profile with Walrus push (checkbox enabled)
- [ ] Verify badge appears after successful push
- [ ] Check developers page filter (All/Onchain/Offchain)
- [ ] Verify onchain profiles appear first
- [ ] Test showcase on homepage shows badges
- [ ] Verify API endpoints return correct data
- [ ] Test with wallet not bound (should disable checkbox)
- [ ] Test transaction failure handling

## Future Enhancements

Potential improvements based on initial brainstorm:

### Incentives

- [ ] Badge system with tiers (Bronze/Silver/Gold based on activity)
- [ ] Leaderboard for onchain developers
- [ ] Integration with WAL token staking rewards
- [ ] Partnership perks (NFT mints, discounts)

### Education

- [ ] Tutorial popup on first Edit Profile visit
- [ ] "Why onchain?" explanation modal
- [ ] Video guide for pushing to Walrus
- [ ] Cost calculator (estimate fees before push)

### Advanced Features

- [ ] Auto-renewal reminders (email/SMS before epoch end)
- [ ] Subsidized fees for first 100 users
- [ ] Testnet → Mainnet migration tool
- [ ] Bulk update for projects/certificates
- [ ] History view (previous blob versions)

## Troubleshooting

### Common Issues

**"Please bind a Sui wallet first"**

- User must bind wallet in Edit Profile before pushing to Walrus

**"Transaction not confirmed onchain yet"**

- Wait a few seconds and retry
- Check wallet transaction history

**"Failed to push to Walrus"**

- Check Walrus publisher URL is configured
- Verify network connectivity
- Check Sui testnet status

**Badge not appearing**

- Refresh page after transaction completes
- Check Supabase `walrus_blob_id` field updated
- Verify transaction succeeded onchain

## Files Modified/Created

### New Files

- `supabase/migrations/002_add_walrus_blob_id.sql`
- `src/pages/api/profile/push-walrus.ts`
- `src/pages/api/developers/list.ts`
- `src/components/DevelopersFilter.tsx`
- `docs/WALRUS_INTEGRATION.md` (this file)

### Modified Files

- `src/lib/auth.ts` - Added `walrus_blob_id` to Developer interface
- `src/components/shared/ProfileForm.tsx` - Added Walrus push section
- `src/pages/developers.astro` - Integrated filter component
- `src/components/DeveloperShowcase.tsx` - Added onchain badges

## Resources

- [Walrus Documentation](https://docs.walrus.site/)
- [Sui Documentation](https://docs.sui.io/)
- [Project Setup Guide](./SETUP_GUIDE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
