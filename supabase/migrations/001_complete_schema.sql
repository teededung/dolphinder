-- Complete Database Schema for Dolphinder
-- This migration includes all schema changes consolidated into one file

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create developers table with all fields
CREATE TABLE developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  github TEXT,
  linkedin TEXT,
  telegram TEXT,
  website TEXT,
  bio TEXT,
  slush_wallet TEXT,
  entry TEXT,
  is_verified BOOLEAN DEFAULT false,
  walrus_blob_id TEXT,
  blob_object_id TEXT,
  projects JSONB DEFAULT '[]'::jsonb,
  certificates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_developers_user_id ON developers(user_id);
CREATE INDEX idx_developers_username ON developers(username);
CREATE INDEX idx_developers_is_verified ON developers(is_verified);
CREATE INDEX idx_developers_walrus_blob_id ON developers(walrus_blob_id);
CREATE INDEX idx_developers_blob_object_id ON developers(blob_object_id);
CREATE INDEX idx_developers_projects ON developers USING GIN (projects);
CREATE INDEX idx_developers_certificates ON developers USING GIN (certificates);

-- Add column comments for documentation
COMMENT ON COLUMN developers.walrus_blob_id IS 'Walrus blob ID for onchain storage - NULL means profile is only offchain';
COMMENT ON COLUMN developers.blob_object_id IS 'Sui object ID of Walrus Blob - used to query storage metadata (epochs, expiry). NULL means metadata query not available.';
COMMENT ON COLUMN developers.projects IS 'Array of project objects with details about developer projects';
COMMENT ON COLUMN developers.certificates IS 'Array of certificate objects with details about developer certifications';

-- Enable Row Level Security
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read verified developers
CREATE POLICY "Public read access for verified developers"
  ON developers
  FOR SELECT
  USING (is_verified = true);

-- Policy: Users can read their own profile (even if not verified)
CREATE POLICY "Users can read their own profile"
  ON developers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own profile (except is_verified)
CREATE POLICY "Users can update their own profile"
  ON developers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON developers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON developers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

