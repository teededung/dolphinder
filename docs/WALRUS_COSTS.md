# Walrus Storage Costs & Payment Model

## Overview

This document explains how Walrus storage costs work on testnet vs mainnet, and who pays for what.

## Current Setup (Testnet)

### Upload Blob

- **Cost:** FREE
- **Who pays:** Publisher/Aggregator node (sponsored)
- **Token:** None required
- **Purpose:** Testing without real costs

### Smart Contract Transaction

- **Cost:** ~0.01 SUI (gas fee)
- **Who pays:** User (from wallet)
- **Token:** SUI
- **Purpose:** Write blob_id to smart contract

## Future Setup (Mainnet)

### Upload Blob

**Cost Formula:**

```
Cost = Storage_Size × Number_of_Epochs × Price_per_GB_per_Epoch
```

**Who pays:** Publisher/Aggregator node (or you if self-hosted)

**Token:** WAL token

- WAL tokens are paid to storage nodes
- Publisher needs sufficient WAL balance
- If out of WAL → upload fails

#### Payment Options:

**Option 1: Use Public Publisher**

- Some publishers may be free with limits
- Some may charge per-upload fees
- May require API key and payment setup

**Option 2: Self-Host Publisher (Recommended)**

- Run your own publisher node
- Load WAL tokens into your node
- Full control over costs
- Users don't need WAL tokens

**Option 3: User Pre-Pay**

- User loads WAL tokens beforehand
- Deduct from balance per upload
- Requires payment system implementation

### Smart Contract Transaction

**Cost:** ~0.01 SUI (gas fee)

**Who pays:** User (from wallet)

**Token:** SUI

Same as testnet - just gas fee for writing blob_id to smart contract.

## Recommended Approach for Dolphinder

### Phase 1: Launch (Recommended)

**Architecture:**

```
User → Dolphinder App → Self-hosted Publisher → Walrus Network
                        (your WAL tokens)
```

**Payment model:**

- ✅ App sponsors storage costs (via self-hosted publisher)
- ✅ User only pays SUI gas fee (~0.01 SUI)
- ✅ Simple UX, good for adoption
- ✅ Predictable costs for you

**Setup:**

1. Run your own Walrus publisher node
2. Fund it with WAL tokens
3. Monitor usage and costs
4. Top up WAL as needed

**Pros:**

- Simple user experience
- Full control over costs
- No need for users to get WAL tokens
- Better for initial adoption

**Cons:**

- You bear storage costs
- Need to maintain infrastructure
- Need to monitor WAL balance

### Phase 2: Scale with Limits

If storage costs become high:

**Tier 1: Free**

- 50KB per profile
- 2 epochs storage
- Covers most users

**Tier 2: Premium**

- Unlimited storage
- Longer epochs
- Subscription based

**Implementation:**

```typescript
const FREE_STORAGE_LIMIT = 50 * 1024; // 50KB
const profileSize = calculateSize(profileData);

if (profileSize > FREE_STORAGE_LIMIT) {
  // Show upgrade prompt or charge user
}
```

### Cost Monitoring

**Track monthly costs:**

```typescript
// Example monitoring
const totalProfiles = 1000;
const avgProfileSize = 30; // KB
const totalStorage = totalProfiles * avgProfileSize; // 30 MB
const epochs = 2;
const walPricePerGB = 0.1; // Example price

const monthlyCost = (totalStorage / 1024) * epochs * walPricePerGB;
console.log(`Estimated monthly WAL cost: ${monthlyCost} WAL`);
```

## Implementation Details

### Current Code (Testnet)

```typescript
// src/lib/walrus.ts
export async function uploadJson(data: unknown, epochs: number = 2) {
  const response = await fetch(`${PUBLISHER_URL}/v1/blobs?epochs=${epochs}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  // Publisher pays (free on testnet)
  return response.json();
}
```

### Mainnet Preparation

**Self-hosted publisher setup:**

1. **Run Walrus publisher node:**

```bash
# Install and configure publisher
walrus publisher --config publisher-config.yaml
```

2. **Fund with WAL tokens:**

```bash
# Transfer WAL to publisher address
sui client transfer-sui \
  --to <PUBLISHER_ADDRESS> \
  --amount 1000000000 \
  --gas-budget 10000000
```

3. **Configure app to use your publisher:**

```env
# .env
PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.dolphinder.io
```

4. **Monitor WAL balance:**

```typescript
// Periodic check
async function checkPublisherBalance() {
  const balance = await getWALBalance(PUBLISHER_ADDRESS);
  if (balance < MINIMUM_WAL_THRESHOLD) {
    // Alert admin to top up
    sendAlert("Low WAL balance: " + balance);
  }
}
```

## Cost Estimation

### Example Calculation

**Assumptions:**

- Average profile size: 30 KB
- Storage duration: 2 epochs (~1 month)
- Number of users: 1,000
- WAL price per GB per epoch: $0.05 (example)

**Monthly cost:**

```
Total storage = 1,000 users × 30 KB = 30 MB
Cost = 0.03 GB × 2 epochs × $0.05 = $0.003

For 1,000 users: ~$3/month in WAL tokens
```

**Very affordable** - much cheaper than traditional cloud storage!

## Summary Table

| Component           | Testnet             | Mainnet                             |
| ------------------- | ------------------- | ----------------------------------- |
| **Blob Upload**     | FREE (sponsored)    | You pay WAL (via publisher)         |
| **TX Gas Fee**      | User pays ~0.01 SUI | User pays ~0.01 SUI                 |
| **User Experience** | Simple              | Same (if you self-host)             |
| **Your Cost**       | $0                  | ~$3-10/month for 1K users           |
| **Recommendation**  | -                   | Self-host publisher + sponsor costs |

## Action Items for Mainnet Launch

- [ ] Set up self-hosted Walrus publisher node
- [ ] Acquire initial WAL tokens (estimate based on expected users)
- [ ] Implement balance monitoring and alerts
- [ ] Set up automatic WAL top-up process
- [ ] Document publisher maintenance procedures
- [ ] Plan for scaling (consider storage tiers if needed)
- [ ] Monitor actual costs vs estimates
- [ ] Adjust storage duration (epochs) based on cost optimization

## References

- [Walrus Documentation](https://docs.wal.app/)
- [Walrus Storage Costs](https://docs.wal.app/dev-guide/dev-operations.html)
- [WAL Token Information](https://coinviet.net/walrus-protocol-la-gi-tim-hieu-ve-giai-phap-luu-tru-phi-tap-trung-tren-sui/)

## Notes

- Walrus storage is **immutable** - once uploaded, data persists
- Testnet is for testing only - no real costs
- Mainnet requires careful cost planning
- Self-hosting gives best control and UX
- WAL token prices may fluctuate
- Monitor and adjust epochs for cost optimization
