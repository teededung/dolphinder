-- Add blob_object_id column to developers table
-- This stores the Sui object ID of the Walrus Blob (not the content hash)
-- Used for querying blob metadata (epochs, storage info) from Sui blockchain

ALTER TABLE developers
ADD COLUMN blob_object_id TEXT;

-- Index for faster queries
CREATE INDEX idx_developers_blob_object_id ON developers(blob_object_id);

-- Comment to explain the field
COMMENT ON COLUMN developers.blob_object_id IS 'Sui object ID of Walrus Blob - used to query storage metadata (epochs, expiry). NULL means metadata query not available.';

-- Note: This is different from walrus_blob_id (content hash)
-- walrus_blob_id = Content-addressed blob ID (stored onchain in smart contract)
-- blob_object_id = Sui object ID of the Blob object (used for metadata queries)

