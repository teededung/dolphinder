# Onchain Storage for Developer Profiles

## Overview

Dolphinder lưu trữ developer profiles trên blockchain Sui thông qua Walrus - decentralized storage system. Profile data và project images được lưu trên Walrus, sau đó reference (blobId) được ghi lên Sui blockchain.

## Architecture

```
Profile Data → Walrus JSON → Blockchain → Display
Project Images → Walrus Quilt → Blockchain → Gallery
```

## Data Models

### DeveloperWalrus (Onchain Format)

```typescript
interface DeveloperWalrus {
  profile: {
    name: string;
    bio?: string;
    github?: string;
    linkedin?: string;
    telegram?: string;
    website?: string;
    avatar?: string;
  };
  projects: Project[];      // Contains project metadata + quilt references
  certificates: Certificate[];
}
```

### Project Structure with Quilt

```typescript
interface Project {
  name: string;
  description: string;
  images: string[];  // Array of image URLs
  // Images are stored in Walrus Quilt, URLs format:
  // "${AGGREGATOR_URL}/v1/quilts/{quiltId}/{patchId}"
}
```

## Complete Flow

### 1. Upload Profile JSON to Walrus

```typescript
import { uploadJson } from '@/lib/walrus';

const { blobId } = await uploadJson(developerData, 3); // 3 epochs
```

### 2. Register/Update on Sui Blockchain

```typescript
import { makeRegisterTx, makeUpdateProfileTx } from '@/lib/sui-tx';

// First time: Register
const tx = makeRegisterTx({ username, blobId, sender: walletAddress });

// Update existing: 
const tx = makeUpdateProfileTx({ devObjectId, blobId, sender: walletAddress });

await signAndExecute({ transaction: tx });
```

### 3. Fetch and Display

```typescript
import { fetchJson } from '@/lib/walrus';
import { getDevIdByUsername } from '@/lib/sui-views';

const devId = await getDevIdByUsername(username);
const profileData = await fetchJson<DeveloperWalrus>(blobId);
```

## Why Walrus Quilt for Projects?

### Problem: Projects Have Multiple Images

Một developer thường có nhiều projects, mỗi project có 1-5+ images (screenshots, demos, diagrams):

```typescript
projects: [
  {
    name: "DeFi Dashboard",
    images: [
      "screenshot1.png",  // 200KB
      "screenshot2.png",  // 180KB
      "demo.gif"          // 1.2MB
    ]
  },
  {
    name: "NFT Marketplace", 
    images: [
      "home.png",         // 150KB
      "gallery.png",      // 300KB
      "profile.png"       // 120KB
    ]
  }
  // ... more projects
]
```

### Solution: Walrus Quilt

**Walrus Quilt** cho phép upload nhiều images như một single unit:

```typescript
import { uploadQuilt, getQuiltPatchUrl } from '@/lib/walrus-quilt';

// 1. Prepare all project images with unique identifiers
const images = [
  { data: base64_1, identifier: 'defi_dashboard_screenshot1' },
  { data: base64_2, identifier: 'defi_dashboard_screenshot2' },
  { data: base64_3, identifier: 'defi_dashboard_demo' },
  { data: base64_4, identifier: 'nft_marketplace_home' },
  { data: base64_5, identifier: 'nft_marketplace_gallery' },
  { data: base64_6, identifier: 'nft_marketplace_profile' },
];

// 2. Upload all images in ONE transaction
const { quiltId, patches } = await uploadQuilt(images, 3);
// → quiltId: "abc123..."
// → patches: [
//     { identifier: 'defi_dashboard_screenshot1', patchId: 'patch_0' },
//     { identifier: 'defi_dashboard_screenshot2', patchId: 'patch_1' },
//     ...
//   ]

// 3. Build image URLs for each project
const projectData = {
  name: "DeFi Dashboard",
  images: [
    getQuiltPatchUrl(quiltId, 'defi_dashboard_screenshot1'),
    getQuiltPatchUrl(quiltId, 'defi_dashboard_screenshot2'),
    getQuiltPatchUrl(quiltId, 'defi_dashboard_demo'),
  ]
};
```

### Benefits of Using Quilt for Projects

#### 1. **Atomic Upload**
- Upload tất cả images của tất cả projects trong **1 transaction duy nhất**
- Không cần lo lắng về partial failures (upload một số ảnh thành công, một số thất bại)
- All-or-nothing: hoặc tất cả ảnh đều được upload, hoặc không có ảnh nào

#### 2. **Simpler State Management**
- Chỉ cần track **1 quiltId** thay vì track N individual blobIds
- Update profile đơn giản hơn: chỉ 1 reference thay vì array of references

```typescript
// Without Quilt (complex)
interface Project {
  name: string;
  imageBlobIds: string[];  // ["blob1", "blob2", "blob3", ...]
}

// With Quilt (simple)
interface Project {
  name: string;
  images: string[];  // URLs built from single quiltId
}
```

#### 3. **Better Data Locality**
- Tất cả images của developer được lưu cùng nhau trong 1 quilt
- Walrus có thể optimize storage và retrieval cho related data
- Faster loading khi display project gallery

#### 4. **Efficient Batch Operations**
- **Single Walrus transaction** = lower latency
- **Single blockchain reference** = cleaner smart contract
- **Single state update** = simpler UI logic

#### 5. **Max 666 Images per Quilt**
- Đủ lớn cho hầu hết use cases
- Ví dụ: 50 projects × 10 images/project = 500 images (vẫn dưới limit)

### Practical Example

```typescript
// User uploads 3 projects with total 8 images

// Step 1: Collect all images
const allImages = [];
projects.forEach((project, projIdx) => {
  project.images.forEach((img, imgIdx) => {
    allImages.push({
      data: img.base64,
      identifier: `project_${projIdx}_img_${imgIdx}`
    });
  });
});

// Step 2: Upload quilt
const { quiltId } = await uploadQuilt(allImages);

// Step 3: Build profile with quilt URLs
const profileData = {
  profile: { name: "John Doe", ... },
  projects: projects.map((proj, projIdx) => ({
    name: proj.name,
    description: proj.description,
    images: proj.images.map((_, imgIdx) => 
      getQuiltPatchUrl(quiltId, `project_${projIdx}_img_${imgIdx}`)
    )
  })),
  certificates: []
};

// Step 4: Upload profile JSON (contains quilt URLs)
const { blobId } = await uploadJson(profileData);

// Step 5: Save to blockchain (single blobId reference)
const tx = makeRegisterTx({ username, blobId, sender });
```

### Quilt URL Structure

```
https://aggregator.walrus.space/v1/quilts/{quiltId}/{patchId}
                                          ↓           ↓
                                     Single Quilt    Individual Image
                                     (All projects)  (Specific screenshot)
```

### When NOT to Use Quilt

- **Single large file** (>10MB): Use regular blob upload
- **Frequently changing images**: Quilt is immutable, cần upload quilt mới
- **Images from external sources**: Nếu images đã có URL, không cần upload lại

## Environment Configuration

```bash
# Walrus
PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# Sui Blockchain
PUBLIC_PACKAGE_ID=0x1234...
PUBLIC_USERNAME_INDEX_ID=0x5678...
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
```

## User Flow

### Upload Profile với Projects

1. Connect wallet
2. Fill profile information
3. Add projects with images
4. Click "Save Profile Onchainly"
   - System uploads images via Quilt (1 transaction)
   - System builds profile JSON with quilt URLs
   - System uploads profile JSON to Walrus
   - System creates blockchain transaction
   - User signs transaction
5. Profile live onchain

### Display Profile

```typescript
// Page: [username]/index.astro
if (developer.walrus_blob_id) {
  // Show onchain profile (from Walrus)
  <OnchainProfileWrapper username={username} />
} else {
  // Show offchain profile (from database)
  <ProfileCard variant="offchain" {...data} />
}
```

## References

- [Walrus Docs](https://docs.walrus.site)
- [Walrus Quilt Spec](https://docs.walrus.site/usage/quilt.html)
- [WALRUS_INTEGRATION.md](./WALRUS_INTEGRATION.md)

