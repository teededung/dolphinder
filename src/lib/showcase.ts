/**
 * Showcase utilities for aggregating projects from all developers.
 * Fetches projects from both onchain (Walrus) and offchain (database) sources.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DeveloperDB } from '@/types/developer';
import type { Project } from '@/types/project';
import { getVerifiedDevelopers } from './auth';
import { fetchJson } from './walrus';
import { getDevIdByUsername } from './sui-views';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { fromBase64 } from '@mysten/bcs';

export interface ProjectWithDeveloper extends Project {
  developer: {
    name: string;
    username: string;
    avatar?: string;
    walrusBlobId?: string;
  };
}

type OnchainData = {
  profile?: {
    name?: string;
    avatar?: string;
  };
  projects?: Project[];
};

/**
 * Fetch onchain data for a developer by blobId
 */
async function fetchOnchainData(blobId: string): Promise<OnchainData | null> {
  try {
    const data = await fetchJson<OnchainData>(blobId);
    return data;
  } catch (error) {
    console.warn(`[Showcase] Failed to fetch onchain data for blobId ${blobId}:`, error);
    return null;
  }
}

/**
 * Get blobId from Sui developer object
 */
async function getBlobIdFromDevObject(devId: string): Promise<string | null> {
  try {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const res = await client.getObject({ id: devId, options: { showContent: true } });
    const fields: any = (res.data as any)?.content?.fields;
    
    if (!fields) return null;
    
    // Decode walrus_blob_id from vector<u8>
    const raw = fields?.walrus_blob_id;
    if (typeof raw === 'string') {
      try {
        const bytes = raw.startsWith('0x')
          ? new Uint8Array(raw.slice(2).match(/.{1,2}/g)?.map((h: string) => parseInt(h, 16)) || [])
          : fromBase64(raw);
        return new TextDecoder().decode(bytes);
      } catch {
        return raw; // fallback
      }
    } else if (Array.isArray(raw)) {
      return new TextDecoder().decode(new Uint8Array(raw));
    }
    
    return null;
  } catch (error) {
    console.warn(`[Showcase] Failed to get blobId from dev object ${devId}:`, error);
    return null;
  }
}

/**
 * Normalize project format (handle old/new format differences)
 */
function normalizeProject(project: any, developer: { name: string; username: string; avatar?: string }): Project | null {
  // Check if it's new format or old format
  const isNewFormat = 'id' in project || 'tags' in project || 'status' in project;
  
  if (!isNewFormat && !project.name) {
    // Skip projects without name
    return null;
  }
  
  const normalized: Project = {
    id: isNewFormat && project.id ? project.id : `${developer.username}_${project.name || 'unknown'}_${Date.now()}`,
    name: project.name || '',
    description: project.description || '',
    repoUrl: isNewFormat ? project.repoUrl : undefined,
    demoUrl: isNewFormat ? project.demoUrl : undefined,
    images: isNewFormat ? (project.images || []) : [],
    walrusQuiltId: isNewFormat ? project.walrusQuiltId : undefined,
    tags: isNewFormat ? (project.tags || []) : (project.technologies || []),
    status: isNewFormat ? (project.status || 'completed') : 'completed',
    featured: isNewFormat ? (project.featured || false) : false,
    createdAt: isNewFormat ? (project.createdAt || new Date().toISOString()) : new Date().toISOString(),
  };
  
  return normalized;
}

/**
 * Aggregate all projects from verified developers.
 * Prioritizes onchain data (if walrus_blob_id exists), falls back to database data.
 */
export async function aggregateAllProjects(
  supabase: SupabaseClient
): Promise<ProjectWithDeveloper[]> {
  // Fetch all verified developers
  const developers = await getVerifiedDevelopers(supabase);
  
  const allProjects: ProjectWithDeveloper[] = [];
  
  // Process each developer
  for (const dev of developers) {
    try {
      let projects: Project[] = [];
      let profileData: OnchainData | null = null;
      
      // Try to fetch onchain data first
      if (dev.walrus_blob_id) {
        try {
          profileData = await fetchOnchainData(dev.walrus_blob_id);
          if (profileData?.projects) {
            projects = profileData.projects;
          }
        } catch (error) {
          console.warn(`[Showcase] Failed to fetch onchain data for ${dev.username}, using database fallback:`, error);
        }
      }
      
      // Fallback to database projects if no onchain data
      if (projects.length === 0 && dev.projects && Array.isArray(dev.projects)) {
        projects = dev.projects;
      }
      
      // Normalize and add developer metadata
      for (const project of projects) {
        const normalized = normalizeProject(project, {
          name: dev.name,
          username: dev.username,
          avatar: profileData?.profile?.avatar || dev.avatar || undefined,
        });
        
        if (normalized) {
          allProjects.push({
            ...normalized,
            developer: {
              name: dev.name,
              username: dev.username,
              avatar: profileData?.profile?.avatar || dev.avatar || undefined,
              walrusBlobId: dev.walrus_blob_id || undefined,
            },
          });
        }
      }
    } catch (error) {
      console.error(`[Showcase] Error processing developer ${dev.username}:`, error);
      // Continue with next developer
    }
  }
  
  // Sort by createdAt (newest first)
  allProjects.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
  
  return allProjects;
}

