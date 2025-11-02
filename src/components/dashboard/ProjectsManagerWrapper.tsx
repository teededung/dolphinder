import { useEffect, useState } from 'react';
import { getDevIdByUsername } from '../../lib/sui-views';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { fromBase64 } from '@mysten/bcs';
import { fetchJson } from '../../lib/walrus';
import ProjectsManager from './ProjectsManager';
import { GlobalSuiProvider } from '../providers/GlobalSuiProvider';
import type { Project } from '../../types/project';

type OnchainData = {
  profile?: {
    name?: string;
    bio?: string;
    entry?: string;
    github?: string;
    linkedin?: string;
    telegram?: string;
    website?: string;
    avatar?: string;
  };
  projects?: Project[];
  certificates?: Array<{
    name: string;
    issuer?: string;
    date?: string;
    url?: string;
  }>;
};

interface ProjectsManagerWrapperProps {
  username: string;
  initialProjects: any[];
  walrusBlobId?: string | null;
}

/**
 * Internal component that loads projects from onchain Walrus
 */
function ProjectsManagerLoader({ 
  username, 
  initialProjects, 
  walrusBlobId 
}: ProjectsManagerWrapperProps) {
  const [projects, setProjects] = useState<any[]>(initialProjects);
  const [loading, setLoading] = useState(!!walrusBlobId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no walrusBlobId, use database projects
    if (!walrusBlobId) {
      setProjects(initialProjects);
      setLoading(false);
      return;
    }

    // Load projects from onchain Walrus
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        const devId = await getDevIdByUsername(username);
        if (!devId) {
          setProjects(initialProjects);
          return;
        }
        
        const client = new SuiClient({ url: getFullnodeUrl('testnet') });
        const res = await client.getObject({ id: devId, options: { showContent: true } });
        const fields: any = (res.data as any)?.content?.fields;
        
        // Decode walrus_blob_id from onchain
        let blobId: string | undefined;
        const raw = fields?.walrus_blob_id;
        if (typeof raw === 'string') {
          try {
            const bytes = raw.startsWith('0x')
              ? new Uint8Array(raw.slice(2).match(/.{1,2}/g)?.map((h: string) => parseInt(h, 16)) || [])
              : fromBase64(raw);
            blobId = new TextDecoder().decode(bytes);
          } catch {
            blobId = raw; // fallback
          }
        } else if (Array.isArray(raw)) {
          blobId = new TextDecoder().decode(new Uint8Array(raw));
        }
        
        if (!blobId) {
          setProjects(initialProjects);
          return;
        }
        
        // Fetch JSON data from Walrus
        const json = await fetchJson<OnchainData>(blobId);
        
        // Merge onchain and database projects
        // Priority: onchain version wins if same project ID exists
        // BUT preserve pending_deletion flag from database
        if (json?.projects && Array.isArray(json.projects) && json.projects.length > 0) {
          const onchainProjects = json.projects;
          const databaseProjects = initialProjects || [];
          
          // Create a map of database projects for quick lookup
          const dbProjectsMap = new Map(databaseProjects.map((p: any) => [p.id, p]));
          
          // Merge onchain projects with database flags (like pending_deletion)
          const mergedOnchainProjects = onchainProjects.map((onchainProject: any) => {
            const dbProject = dbProjectsMap.get(onchainProject.id);
            if (dbProject?.pending_deletion) {
              // Preserve pending_deletion flag from database
              return {
                ...onchainProject,
                pending_deletion: true
              };
            }
            return onchainProject;
          });
          
          // Get all onchain project IDs
          const onchainIds = new Set(onchainProjects.map((p: any) => p.id));
          
          // Get database projects that are NOT on onchain (i.e., not synced yet)
          const uniqueDatabaseProjects = databaseProjects.filter((p: any) => !onchainIds.has(p.id));
          
          // Merge: onchain projects (with preserved flags) + unique database projects
          const mergedProjects = [...mergedOnchainProjects, ...uniqueDatabaseProjects];
          
          setProjects(mergedProjects);
        } else {
          // No onchain projects, use all database projects
          setProjects(initialProjects);
        }
      } catch (e: any) {
        setError(String(e?.message || e));
        // Fallback to database projects on error
        setProjects(initialProjects);
      } finally {
        setLoading(false);
      }
    })();
  }, [username, walrusBlobId, JSON.stringify(initialProjects)]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="h-8 w-8 animate-spin text-white/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <>
      {/* Error/Warning Banner */}
      {error && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          <p className="font-medium">⚠️ Could not load onchain projects</p>
          <p className="text-xs mt-1">Showing database projects instead. Error: {error}</p>
        </div>
      )}

      {/* Projects Manager */}
      <ProjectsManager 
        initialProjects={projects}
      />
    </>
  );
}

/**
 * Wrapper component that provides GlobalSuiProvider context
 */
function ProjectsManagerWrapper(props: ProjectsManagerWrapperProps) {
  return (
    <GlobalSuiProvider>
      <ProjectsManagerLoader {...props} />
    </GlobalSuiProvider>
  );
}

export default ProjectsManagerWrapper;

