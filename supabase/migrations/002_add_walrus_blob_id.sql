-- Add walrus_blob_id column to developers table
-- This field caches the Walrus blob ID for quick querying and filtering

ALTER TABLE developers
ADD COLUMN walrus_blob_id TEXT;

-- Create index for faster filtering by onchain status
CREATE INDEX idx_developers_walrus_blob_id ON developers(walrus_blob_id);

-- Add comment for documentation
COMMENT ON COLUMN developers.walrus_blob_id IS 'Walrus blob ID for onchain storage - NULL means profile is only offchain';

