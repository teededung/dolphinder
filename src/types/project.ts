export interface ProjectImage {
  filename?: string;             // Just the filename (e.g., "49c1f7d86rej-1761833413291.jpeg")
  quiltPatchId?: string;         // Walrus quilt patch ID (for verification/sync only)
  metadata?: {
    size: number;                // Image size in bytes
    format: string;              // Image format (jpg, png, etc)
    index: number;               // Index in the project's image array
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  repoUrl?: string;
  demoUrl?: string;
  images?: (string | ProjectImage)[]; // Support both old (string) and new (ProjectImage) format
  walrusQuiltId?: string;        // Quilt ID containing all project images
  tags: string[];
  status: 'active' | 'completed' | 'in-progress';
  featured: boolean;
  createdAt: string;
}

