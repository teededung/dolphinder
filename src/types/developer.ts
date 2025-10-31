import type { Project } from './project';
import type { Certificate } from './certificate';

/**
 * Profile data structure used for Walrus storage
 * This represents the format stored on-chain
 */
export interface ProfileData {
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
 * Developer profile for UI display
 * Maps from database model (snake_case) to UI model (camelCase)
 */
export interface DeveloperProfile {
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

