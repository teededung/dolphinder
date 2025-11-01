# Unbind Wallet with Walrus Profile Cleanup

## Overview

This document describes the implementation of safe wallet unbinding that handles on-chain Walrus profiles properly.

## Problem

When a user has pushed their profile to Walrus blockchain and wants to unbind their wallet, we need to:

1. Warn them about the on-chain profile
2. Clear database references
3. Revert profile to off-chain mode

## Solution

### Flow Diagram

```
User clicks "Unbind" button
    ↓
Check if walrus_blob_id exists?
    ↓ YES
Show UnbindWarningModal
    ↓
User confirms?
    ↓ YES
Clear database references
    ↓
Reload page → Profile shows as "offchain"
```

**Note:** We only clear database references (`walrus_blob_id` and `blob_object_id`). The blob data remains on Walrus storage (immutable blockchain storage) but is no longer linked to the user's profile in our system.

## Implementation Details

### 1. Warning Modal Component

**File:** `src/components/shared/UnbindWarningModal.tsx`

Features:

- Shows warning about on-chain profile
- Explains that blob reference will be cleared
- Clears database references only
- Provides clear feedback during the process

### 2. API Endpoint

**File:** `src/pages/api/profile/delete-walrus.ts`

POST endpoint that:

- Authenticates user
- Verifies user has walrus_blob_id
- **Cleans Walrus metadata from projects:**
  - Removes `walrusQuiltId` from each project
  - Removes `quiltPatchId` and `blobId` from project images
  - Keeps images with `filename` or `localPath` (Supabase storage)
  - Filters out images that only have Walrus storage
- Clears `slush_wallet`, `walrus_blob_id` and `blob_object_id` from Supabase
- Updates `projects` field with cleaned data
- Returns success/error response

**Important:** This endpoint clears database references and Walrus metadata from projects. The blob data remains on Walrus storage permanently, but projects will show as "Offchain Only" and images will load from Supabase storage.

### 3. Updated ProfileForm

**File:** `src/components/shared/ProfileForm.tsx`

Modified Unbind button logic:

```typescript
onClick={() => {
  if (developer.walrus_blob_id && developer.blob_object_id) {
    // Show warning modal for on-chain profiles
    open({ content: <UnbindWarningModal ... /> });
  } else {
    // No on-chain profile, unbind directly
    handleWalletChange("");
  }
}}
```

## User Experience

### Scenario 1: User with On-chain Profile

1. User clicks "Unbind"
2. Warning modal appears:
   - "You have a profile stored on Walrus blockchain"
   - "The on-chain profile reference will be removed from your account"
   - Shows blob ID and explanation
   - Notes that blob data remains on Walrus but won't be linked anymore
3. User clicks "Clear & Unbind"
4. Database references cleared:
   - `walrus_blob_id` and `blob_object_id` set to null
   - `slush_wallet` set to null
   - **Projects cleaned:** Walrus metadata removed from all projects
   - **Images updated:** Projects now load images from Supabase storage
5. Page reloads → Profile shows as "offchain"
6. **Projects display:** All projects show "Offchain Only" badge instead of "On Walrus"

**Note:** Blob data remains on Walrus storage permanently (immutable blockchain) but is no longer linked to the user's profile in our system. Projects are cleaned to remove all Walrus references.

### Scenario 2: User without On-chain Profile

1. User clicks "Unbind"
2. Unbind happens immediately (no modal)
3. Wallet address cleared from database
4. Success message shown

## Technical Considerations

### Why We Don't Delete Blobs On-chain

**Reasons for simplified approach:**

1. **Ownership complexity:** Blob objects may be owned by Walrus system, not the user directly
2. **Transaction errors:** Attempting to delete can cause "not signed by correct sender" errors
3. **Immutable storage:** Walrus is designed for permanent storage - blobs persist regardless
4. **User experience:** Simpler flow without wallet signatures and potential transaction failures

**Our approach:**

- Clear database references only (`walrus_blob_id`, `blob_object_id`, and `slush_wallet`)
- Clean Walrus metadata from projects (`walrusQuiltId`, `quiltPatchId`, `blobId`)
- Blob data remains on Walrus storage (immutable blockchain storage)
- Profile shows as "offchain" after unbinding
- Projects show "Offchain Only" badge and load images from Supabase
- User can re-push to Walrus anytime if needed

### Future Improvements

1. **Add "Re-link" feature:**
   - Allow users to re-link to their existing Walrus blob
   - Verify blob ownership before linking
   - Useful if user accidentally unbound wallet

2. **Blob expiry warning:**
   - Show warning when blob storage is about to expire
   - Allow user to extend storage period

3. **Multiple blob versions:**
   - Keep history of blob IDs
   - Allow user to see previous versions

## Testing

### Manual Testing Steps

1. **Test with on-chain profile:**
   - Create profile and push to Walrus
   - Add projects with images stored on Walrus (should show "On Walrus" badge)
   - Verify `walrus_blob_id` and `blob_object_id` exist in database
   - Click "Unbind" → Modal should appear
   - Confirm → Should clear references and clean projects
   - Verify profile shows as "offchain"
   - **Verify projects show "Offchain Only" badge**
   - **Verify images load from Supabase storage**

2. **Test without on-chain profile:**
   - Create profile without pushing to Walrus
   - Click "Unbind" → Should unbind immediately
   - No modal should appear

3. **Test with/without wallet:**
   - Test both scenarios described above
   - Verify proper error handling

## Files Modified

- `src/components/shared/ProfileForm.tsx` - Updated Unbind button logic
- `src/components/shared/UnbindWarningModal.tsx` - New modal component (simplified)
- `src/pages/api/profile/delete-walrus.ts` - New API endpoint (no transaction needed)

## Related Documentation

- [Walrus Integration Guide](./WALRUS_INTEGRATION.md)
- [Walrus Operations Documentation](https://docs.wal.app/dev-guide/dev-operations.html)
- [Setup Guide](./SETUP_GUIDE.md)
