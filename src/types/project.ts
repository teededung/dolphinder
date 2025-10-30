export interface Project {
  id: string;
  name: string;
  description: string;
  repoUrl?: string;
  demoUrl?: string;
  images?: string[]; // Array of image URLs (max 5)
  tags: string[];
  status: 'active' | 'completed' | 'in-progress';
  featured: boolean;
  createdAt: string;
}

