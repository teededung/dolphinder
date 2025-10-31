import type { Project } from './project';
import type { Certificate } from './certificate';

/**
 * Database model - Use for Supabase queries and mutations
 * Represents the complete database schema (snake_case)
 */
export interface DeveloperDB {
  id: string;
  user_id: string;
  username: string;
  name: string;
  avatar: string | null;
  github: string | null;
  linkedin: string | null;
  telegram: string | null;
  website: string | null;
  bio: string | null;
  slush_wallet: string | null;
  entry: string | null;
  projects: any[] | null; // Array of project objects
  certificates: any[] | null; // Array of certificate objects
  walrus_blob_id: string | null;
  blob_object_id: string | null; // Sui object ID of Walrus Blob (for metadata queries)
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Walrus storage model - Use for on-chain storage
 * This represents the format stored on Walrus/Sui blockchain
 */
export interface DeveloperWalrus {
  profile: {
    name: string;
    bio?: string;
    entry?: string;
    github?: string;
    linkedin?: string;
    telegram?: string;
    website?: string;
    avatar?: string;
  };
  projects: any[];
  certificates: any[];
}

/**
 * UI display model - Use for frontend rendering
 * Maps from database model (snake_case) to UI model (camelCase)
 */
export interface DeveloperUI {
  name: string;
  username: string;
  avatar: string;
  bio: string;
  github: string;
  linkedin: string;
  telegram: string;
  website: string;
  slushWallet: string;
  entry: string;
  projects: Project[];
  certificates: Certificate[];
  walrusBlobId: string | null;
}

// Legacy aliases for backward compatibility
/**
 * @deprecated Use DeveloperDB instead
 */
export type Developer = DeveloperDB;
