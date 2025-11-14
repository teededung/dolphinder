import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import type { Project, ProjectImage } from '../../types/project';
import { Trash2, Edit2, Plus, X, Check, ExternalLink, Star, Upload, Image as ImageIcon, AlertTriangle, Cloud, HardDrive, RotateCcw } from 'lucide-react';
import { getQuiltPatchUrl } from '../../lib/walrus-quilt';
import { getWalrusImageUrl } from '../../lib/walrus';
import { ProjectImagePlaceholder } from '../shared/ProjectImagePlaceholder';

interface ProjectsManagerProps {
  initialProjects: any[];
  onProjectsChange?: (projects: Project[]) => void;
}

const DEFAULT_TAGS = ['React', 'TypeScript', 'Tailwind', 'Next.js', 'Web2', 'Web3', 'NFT', 'GameFi', 'DeFi', 'SocialFi', 'AI', 'Smart Contract', 'Solidity', 'Move', 'Sui', 'Solana', 'Ethereum'];

/**
 * Component for displaying project image with fallback to placeholder
 */
function ProjectImageWithFallback({ 
  imgSrc, 
  projectName, 
  imgIdx,
  hasQuiltPatch,
  showRemoveButton = false,
  onRemove
}: { 
  imgSrc: string; 
  projectName: string; 
  imgIdx: number;
  hasQuiltPatch: boolean;
  showRemoveButton?: boolean;
  onRemove?: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add timeout to hide loading after 5 seconds (fallback for cached images)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn(`Image loading timeout, forcing display: ${imgSrc}`);
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [imgSrc, isLoading]);

  if (imageError) {
    return (
      <div className="relative group">
        <ProjectImagePlaceholder size="sm" />
        {showRemoveButton && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative group">
      {isLoading && (
        <div className="h-16 w-16 flex items-center justify-center rounded-md border border-gray-300 bg-gray-100 absolute inset-0 z-10">
          <svg className="h-5 w-5 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      <img
        src={imgSrc}
        alt={`${projectName} - Image ${imgIdx + 1}`}
        className="h-16 w-16 object-cover rounded-md border border-gray-200"
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={(e) => {
          console.error(`Failed to load image: ${imgSrc}`);
          setIsLoading(false);
          setImageError(true);
        }}
      />
      {hasQuiltPatch && !imageError && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-emerald-500/90 text-white text-[8px] text-center py-0.5 rounded-b-md">
          Walrus
        </div>
      )}
      {showRemoveButton && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove image"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/**
 * Get image URL from ProjectImage with Walrus support
 */
function getImageSrc(img: string | ProjectImage): string | null {
  if (typeof img === 'string') {
    // If it's already a full URL, return as is
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    return img;
  }
  
  // Priority 1: blobId (direct Walrus blob)
  if (img.blobId) {
    return getWalrusImageUrl(img.blobId);
  }
  
  // Priority 2: quiltPatchId (Walrus quilt patch)
  if (img.quiltPatchId) {
    return getQuiltPatchUrl(img.quiltPatchId);
  }
  
  // Priority 3: filename (Supabase Storage or local)
  if (img.filename) {
    // If filename is already a full URL (from Supabase Storage), return as is
    if (img.filename.startsWith('http://') || img.filename.startsWith('https://')) {
      return img.filename;
    }
    // Otherwise, assume it's a local path
    return `/projects/${img.filename}`;
  }
  
  return null;
}

/**
 * Check if a project is stored on Walrus
 */
function isProjectOnWalrus(project: Project): boolean {
  // Check if project has walrusQuiltId
  if (project.walrusQuiltId) {
    return true;
  }
  
  // Check if any image has quiltPatchId or blobId
  if (project.images && project.images.length > 0) {
    return project.images.some(img => {
      if (typeof img === 'object') {
        return !!(img.quiltPatchId || img.blobId);
      }
      return false;
    });
  }
  
  return false;
}

// Normalize projects from database to ensure they match Project type
// Supports both old format (images: string[]) and new format (images: ProjectImage[])
function normalizeProjects(rawProjects: any[]): Project[] {
  if (!Array.isArray(rawProjects)) {
    return [];
  }
  
  const normalized = rawProjects.map((p: any) => {
    // Normalize images to support both old and new formats
    const normalizedImages = Array.isArray(p.images) 
      ? p.images.map((img: any) => {
          // If it's already a ProjectImage object, keep it
          if (typeof img === 'object' && img !== null && (img.localPath || img.quiltPatchId || img.filename)) {
            return img as ProjectImage;
          }
          // If it's a string (old format), convert to new format with localPath only
          if (typeof img === 'string') {
            return img; // Keep backward compatibility
          }
          return null;
        }).filter(Boolean)
      : [];

    // Check if it's already in new format
    if (p.id && p.name && p.description && p.status && Array.isArray(p.tags)) {
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        repoUrl: p.repoUrl || undefined,
        demoUrl: p.demoUrl || undefined,
        images: normalizedImages,
        walrusQuiltId: p.walrusQuiltId || undefined,
        tags: p.tags || [],
        status: p.status as Project['status'],
        featured: p.featured || false,
        createdAt: p.createdAt || new Date().toISOString(),
        pending_deletion: p.pending_deletion || undefined,
      };
    }
    
    // Migrate old format to new format
    return {
      id: p.id || crypto.randomUUID(),
      name: p.name || '',
      description: p.description || '',
      repoUrl: p.repoUrl || p.url || undefined,
      demoUrl: p.demoUrl || undefined,
      images: normalizedImages,
      walrusQuiltId: p.walrusQuiltId || undefined,
      tags: p.tags || p.technologies || [],
      status: (p.status || 'active') as Project['status'],
      featured: p.featured || false,
      createdAt: p.createdAt || new Date().toISOString(),
      pending_deletion: p.pending_deletion || undefined,
    };
  });
  
  // Filter out invalid projects
  const filtered = normalized.filter((p: Project) => p.name && p.name.trim().length > 0);
  
  return filtered;
}

export default function ProjectsManager({ initialProjects = [], onProjectsChange }: ProjectsManagerProps) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const normalized = normalizeProjects(initialProjects);
    return normalized;
  });
  
  // Update projects when initialProjects changes (e.g., after page reload)
  useEffect(() => {
    const normalized = normalizeProjects(initialProjects);
    setProjects(normalized);
  }, [JSON.stringify(initialProjects)]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    repoUrl: '',
    demoUrl: '',
    images: [],
    tags: [],
    status: 'active',
    featured: false,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImages, setPreviewImages] = useState<Map<number, string>>(new Map()); // Store blob URLs for preview
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<number>(0); // Track number of images being uploaded

  // Initialize editing mode
  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setFormData(project);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  // Cancel editing/adding
  const cancelForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      name: '',
      description: '',
      repoUrl: '',
      demoUrl: '',
      images: [],
      tags: [],
      status: 'active',
      featured: false,
    });
    setError('');
    setSuccess('');
  };

  // Add new project
  const startAdd = () => {
    cancelForm();
    setShowForm(true);
  };

  // Handle tag toggle
  const toggleTag = (tag: string) => {
    const currentTags = formData.tags || [];
    if (currentTags.includes(tag)) {
      setFormData({ ...formData, tags: currentTags.filter(t => t !== tag) });
    } else {
      setFormData({ ...formData, tags: [...currentTags, tag] });
    }
  };

  // Handle image upload (supports multiple files)
  const handleImageUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const currentImages = formData.images || [];
    const filesArray = Array.from(files);
    
    // Check max 5 images total
    const availableSlots = 5 - currentImages.length;
    if (availableSlots <= 0) {
      setError('Maximum 5 images allowed');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Limit files to available slots
    const filesToUpload = filesArray.slice(0, availableSlots);
    
    if (filesArray.length > availableSlots) {
      setError(`Only uploading ${availableSlots} image(s) to stay within limit of 5`);
      setTimeout(() => setError(''), 3000);
    }

    // Validate all files before uploading
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    for (const file of filesToUpload) {
      // Validate file size (max 3MB)
      if (file.size > 3 * 1024 * 1024) {
        setError(`${file.name}: Image size must be less than 3MB`);
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Validate file type
      if (!validTypes.includes(file.type)) {
        setError(`${file.name}: Invalid file type. Supported: JPG, PNG, GIF, WebP`);
        setTimeout(() => setError(''), 3000);
        return;
      }
    }

    setError('');
    setUploadQueue(filesToUpload.length);

    // Upload files sequentially
    let uploadedCount = 0;
    let tempImages = [...currentImages];
    const projectId = formData.id || editingId || crypto.randomUUID();

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const previewIndex = currentImages.length + i;

      try {
        // Create blob URL for immediate preview
        const blobUrl = URL.createObjectURL(file);
        setPreviewImages(prev => new Map(prev).set(previewIndex, blobUrl));
        
        // Add placeholder to images array for preview
        const placeholderPath = `blob:${previewIndex}`;
        tempImages.push(placeholderPath);
        setFormData({ 
          ...formData, 
          images: [...tempImages] 
        });

        // Upload to server
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);
        uploadFormData.append('projectId', projectId);

        const response = await fetch('/api/projects/upload-image', {
          method: 'POST',
          body: uploadFormData,
        });

        const result = await response.json();

        if (!response.ok) {
          // Remove preview on error
          setPreviewImages(prev => {
            const newMap = new Map(prev);
            newMap.delete(previewIndex);
            return newMap;
          });
          tempImages = tempImages.filter((_, idx) => idx !== previewIndex);
          throw new Error(result.error || 'Failed to upload image');
        }

        // Replace placeholder with actual server path
        const imagePath = result.imagePath;
        tempImages[previewIndex] = imagePath;
        
        setFormData({ 
          ...formData, 
          id: projectId,
          images: [...tempImages] 
        });
        
        uploadedCount++;

        // Clean up blob URL after a short delay
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          setPreviewImages(prev => {
            const newMap = new Map(prev);
            newMap.delete(previewIndex);
            return newMap;
          });
        }, 2000);

      } catch (err: any) {
        console.error(`Error uploading ${file.name}:`, err);
        setError(err.message || `Failed to upload ${file.name}`);
      }
    }

    setUploadQueue(0);
    
    if (uploadedCount > 0) {
      setSuccess(`Successfully uploaded ${uploadedCount} image(s)`);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleImageUpload(files);
    }
    // Reset file input
    e.target.value = '';
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageUpload(files);
    }
  };

  // Remove image from list
  const removeImage = (index: number) => {
    const currentImages = formData.images || [];
    // Clean up blob URL if exists
    const blobUrl = previewImages.get(index);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setPreviewImages(prev => {
        const newMap = new Map(prev);
        newMap.delete(index);
        return newMap;
      });
    }
    const updatedImages = currentImages.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updatedImages });
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.name || formData.name.trim().length === 0) {
      setError('Project name is required');
      return false;
    }
    if (!formData.description || formData.description.trim().length === 0) {
      setError('Project description is required');
      return false;
    }
    return true;
  };

  // Save project (add or update) with auto-save to server
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setError('');
    setLoading(true);

    let updatedProjects: Project[];

    if (editingId) {
      // Update existing project
      updatedProjects = projects.map(p => 
        p.id === editingId 
          ? { ...formData as Project, id: editingId, createdAt: p.createdAt }
          : p
      );
    } else {
      // Add new project
      const newProject: Project = {
        id: formData.id || crypto.randomUUID(),
        name: formData.name!.trim(),
        description: formData.description!.trim(),
        repoUrl: formData.repoUrl?.trim() || undefined,
        demoUrl: formData.demoUrl?.trim() || undefined,
        images: formData.images || [],
        tags: formData.tags || [],
        status: formData.status || 'active',
        featured: formData.featured || false,
        createdAt: new Date().toISOString(),
      };
      updatedProjects = [...projects, newProject];
    }

    try {
      // Save to server first (no optimistic update)
      const response = await fetch('/api/profile/update-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: updatedProjects }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save project');
      }

      // Success: update state, close form and show success message
      setProjects(updatedProjects);
      onProjectsChange?.(updatedProjects);
      cancelForm();
      setSuccess(editingId ? 'Project updated successfully!' : 'Project added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setLoading(false);
    } catch (err: any) {
      console.error('Error saving project:', err);
      setError(err.message || 'Failed to save project. Please check your connection and try again.');
      setLoading(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  // Delete project (called after confirmation)
  const handleDelete = async () => {
    if (!projectToDelete) return;

    setLoading(true);
    setError('');
    setDeleteDialogOpen(false);

    // Save original projects for potential revert
    const originalProjects = [...projects];
    
    // Check if project is on Walrus
    const isOnWalrus = isProjectOnWalrus(projectToDelete);
    
    let updatedProjects: Project[];
    
    if (isOnWalrus) {
      // Soft delete: Mark project for deletion (will be removed on next Walrus sync)
      updatedProjects = projects.map(p => 
        p.id === projectToDelete.id 
          ? { ...p, pending_deletion: true }
          : p
      );
    } else {
      // Hard delete: Remove project immediately (not on Walrus)
      updatedProjects = projects.filter(p => p.id !== projectToDelete.id);
    }
        
    // Update local state immediately for better UX
    setProjects(updatedProjects);
    onProjectsChange?.(updatedProjects);
    
    try {
      // Update projects in database
      const response = await fetch('/api/profile/update-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: updatedProjects }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || isOnWalrus ? 'Failed to mark project for deletion' : 'Failed to delete project');
      }

      if (isOnWalrus) {
        setSuccess('Project marked for deletion. It will be removed when you sync to Walrus.');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setSuccess('Project deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
      
      setProjectToDelete(null);
      setLoading(false);
    } catch (err: any) {
      console.error('Error deleting project:', err);
      // Revert state on error
      setProjects(originalProjects);
      onProjectsChange?.(originalProjects);
      setError(err.message || 'Failed to delete project');
      setLoading(false);
    }
  };

  // Restore project (undo soft delete)
  const handleRestore = async (project: Project) => {
    setLoading(true);
    setError('');

    // Save original projects for potential revert
    const originalProjects = [...projects];
    
    // Remove pending_deletion flag
    const updatedProjects = projects.map(p => 
      p.id === project.id 
        ? { ...p, pending_deletion: undefined }
        : p
    );
    
    // Update local state immediately
    setProjects(updatedProjects);
    onProjectsChange?.(updatedProjects);
    
    try {
      // Update projects in database
      const response = await fetch('/api/profile/update-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: updatedProjects }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to restore project');
      }

      setSuccess('Project restored successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setLoading(false);
    } catch (err: any) {
      console.error('Error restoring project:', err);
      // Revert state on error
      setProjects(originalProjects);
      onProjectsChange?.(originalProjects);
      setError(err.message || 'Failed to restore project');
      setLoading(false);
    }
  };



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Projects</h3>
        {!showForm && (
          <Button
            onClick={startAdd}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Project' : 'Add New Project'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Project Name *
              </label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., My Awesome Project"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your project..."
                required
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-hidden ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="repoUrl" className="mb-2 block text-sm font-medium">
                  Repository URL
                </label>
                <Input
                  id="repoUrl"
                  type="url"
                  value={formData.repoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                  placeholder="https://github.com/username/repo"
                />
              </div>

              <div>
                <label htmlFor="demoUrl" className="mb-2 block text-sm font-medium">
                  Demo URL
                </label>
                <Input
                  id="demoUrl"
                  type="url"
                  value={formData.demoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                  placeholder="https://demo.example.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Project Images (Max 5, each max 3MB)
              </label>
              
              {/* Display uploaded images */}
              {formData.images && formData.images.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {formData.images.map((image, index) => {
                    // Support both old format (string) and new format (ProjectImage)
                    const isProjectImage = typeof image === 'object';
                    const quiltPatchId = isProjectImage ? image.quiltPatchId : undefined;
                    
                    // Priority: preview blob > Walrus > localhost
                    const previewUrl = previewImages.get(index);
                    const imgSrc = previewUrl || getImageSrc(image);
                    
                    const isBlob = imgSrc?.startsWith('blob:') || false;
                    const hasQuiltPatch = !!quiltPatchId;
                    
                    // Show loading spinner while uploading
                    if (isBlob && uploadQueue > 0) {
                      return (
                        <div key={index} className="h-16 w-16 flex items-center justify-center rounded-md border border-gray-300 bg-gray-100">
                          <svg className="h-5 w-5 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      );
                    }
                    
                    if (!imgSrc) return null;
                    
                    return (
                      <ProjectImageWithFallback
                        key={index}
                        imgSrc={imgSrc}
                        projectName={formData.name || 'Project'}
                        imgIdx={index}
                        hasQuiltPatch={hasQuiltPatch}
                        showRemoveButton={true}
                        onRemove={() => removeImage(index)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Drag & Drop Zone */}
              {(!formData.images || formData.images.length < 5) && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('projectImages')?.click()}
                  className={`relative border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                  } ${uploadQueue > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="file"
                    id="projectImages"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileInputChange}
                    disabled={uploadQueue > 0}
                    multiple
                    className="hidden"
                  />
                  
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gray-200 p-2 flex-shrink-0">
                      {uploadQueue > 0 ? (
                        <svg className="h-5 w-5 animate-spin text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <Upload className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        {uploadQueue > 0 
                          ? `Uploading ${uploadQueue} image(s)...`
                          : isDragging 
                            ? 'Drop images here' 
                            : 'Drag & drop or click to select images'
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formData.images?.length || 0}/5 images • JPG, PNG, GIF, WebP • Max 3MB each
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Tags</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_TAGS.map(tag => {
                  const isSelected = formData.tags?.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Selected: {formData.tags.join(', ')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="mb-2 block text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-hidden ring-offset-background focus:ring-2 focus:ring-ring"
              >
                <option value="active">Active</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured || false}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="featured" className="text-sm font-medium flex items-center gap-1">
                <Star className="h-4 w-4" />
                Featured Project
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                {editingId ? 'Update' : 'Add'} Project
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={cancelForm}
                disabled={loading}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects List */}
      {projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map(project => (
            <Card key={project.id} className={project.featured ? 'border-yellow-400 border-2' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-semibold text-lg">{project.name}</h4>
                      {project.featured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.status}
                      </span>
                      {/* Pending Deletion Badge */}
                      {project.pending_deletion ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 border border-red-300">
                          <AlertTriangle className="h-3 w-3" />
                          Will be removed on sync
                        </span>
                      ) : (
                        <>
                          {/* Walrus Storage Badge */}
                          {isProjectOnWalrus(project) ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <img src="/walrus.svg" alt="Walrus" className="h-3 w-3" />
                              On Walrus
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                              <HardDrive className="h-3 w-3" />
                              Offchain
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                    
                    {/* Project Images */}
                    {project.images && project.images.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {project.images.map((img, imgIdx) => {
                          // Get image source with Walrus support
                          const imgSrc = getImageSrc(img);
                          
                          // Support both old format (string) and new format (ProjectImage)
                          const isProjectImage = typeof img === 'object';
                          const quiltPatchId = isProjectImage ? img.quiltPatchId : undefined;
                          const hasQuiltPatch = !!quiltPatchId;
                          
                          if (!imgSrc) return null;
                          
                          return (
                            <ProjectImageWithFallback 
                              key={imgIdx}
                              imgSrc={imgSrc}
                              projectName={project.name}
                              imgIdx={imgIdx}
                              hasQuiltPatch={hasQuiltPatch}
                            />
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.tags && project.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block rounded-full bg-blue-100 text-blue-800 px-2 py-1 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Repository
                        </a>
                      )}
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Demo
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!project.pending_deletion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(project)}
                        disabled={loading || showForm}
                        className="gap-1"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {project.pending_deletion ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(project)}
                        disabled={loading}
                        className="gap-1 text-green-600 hover:text-green-700"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(project)}
                        disabled={loading || showForm}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
            <p>No projects yet. Click "Add Project" to get started!</p>
          </div>
        )
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Project
            </DialogTitle>
            <DialogDescription>
              {projectToDelete && isProjectOnWalrus(projectToDelete) ? (
                <>
                  This project is stored on Walrus. It will be marked for deletion and removed when you sync to Walrus.
                </>
              ) : (
                <>
                  Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {projectToDelete && (
            <div className={`my-4 rounded-lg border p-4 ${
              isProjectOnWalrus(projectToDelete)
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-red-200 bg-red-50'
            }`}>
              <p className={`text-sm font-medium mb-1 ${
                isProjectOnWalrus(projectToDelete)
                  ? 'text-yellow-900'
                  : 'text-red-900'
              }`}>
                {projectToDelete.name}
              </p>
              {projectToDelete.description && (
                <p className={`text-xs line-clamp-2 ${
                  isProjectOnWalrus(projectToDelete)
                    ? 'text-yellow-700'
                    : 'text-red-700'
                }`}>
                  {projectToDelete.description}
                </p>
              )}
              {isProjectOnWalrus(projectToDelete) ? (
                <div className="mt-2 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700">
                    This project will be marked for deletion. You can restore it before syncing to Walrus.
                  </p>
                </div>
              ) : (
                <>
                  {projectToDelete.images && projectToDelete.images.length > 0 && (
                    <p className="text-xs text-red-600 mt-2">
                      This will also remove {projectToDelete.images.length} associated image{projectToDelete.images.length > 1 ? 's' : ''}.
                    </p>
                  )}
                  <div className="mt-2 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">
                      This project will be permanently deleted from the database immediately.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setProjectToDelete(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

