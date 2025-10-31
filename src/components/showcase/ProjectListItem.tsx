import { ExternalLink, Github, Globe, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { getQuiltPatchUrl } from '@/lib/walrus-quilt';
import type { ProjectWithDeveloper } from '@/lib/showcase';
import type { ProjectImage } from '@/types/project';

interface ProjectListItemProps {
  project: ProjectWithDeveloper;
  onClick: () => void;
}

/**
 * Get image URL from project image (supports old string format, new ProjectImage format, and quilt patches)
 */
function getImageUrl(image: string | ProjectImage, project: ProjectWithDeveloper): string | null {
  // Old format: string URL
  if (typeof image === 'string') {
    return image;
  }
  
  // New format: ProjectImage with filename
  if (image.filename) {
    return `/projects/${image.filename}`;
  }
  
  // Quilt patch: need quiltId and patchId
  if (image.quiltPatchId && project.walrusQuiltId) {
    return getQuiltPatchUrl(project.walrusQuiltId, image.quiltPatchId);
  }
  
  return null;
}

export default function ProjectListItem({ project, onClick }: ProjectListItemProps) {
  // Get up to 3 images for preview grid
  const images = project.images || [];
  const previewImages = images.slice(0, 3);
  
  return (
    <div
      onClick={onClick}
      className={`
        bg-white/5 border rounded-lg p-4 cursor-pointer transition-all
        hover:bg-white/[0.06] hover:border-white/20 hover:shadow-lg
        ${project.featured ? 'border-yellow-400/50 shadow-lg shadow-yellow-400/10' : 'border-white/10'}
      `}
    >
      <div className="flex gap-4">
        {/* Image Preview */}
        <div className="flex-shrink-0 w-40 h-24 rounded-lg overflow-hidden border border-white/10 bg-white/5">
          {previewImages.length > 0 ? (
            <div className={`h-full ${
              previewImages.length === 1 ? 'grid grid-cols-1' :
              previewImages.length === 2 ? 'grid grid-cols-2 gap-0.5' :
              'grid grid-cols-3 gap-0.5'
            }`}>
              {previewImages.map((img, idx) => {
                const imgUrl = getImageUrl(img, project);
                if (!imgUrl) return null;
                
                return (
                  <div key={idx} className="relative h-full">
                    <img
                      src={imgUrl}
                      alt={`${project.name} preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs text-white/40">No Image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-white truncate">{project.name}</h3>
              {project.featured && (
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 shrink-0" />
              )}
              {project.status && (
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  project.status === 'active' ? 'bg-green-500/20 text-green-300' :
                  project.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {project.status}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.tags.slice(0, 5).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-block rounded-full bg-white/10 text-white/70 px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 5 && (
                <span className="inline-block rounded-full bg-white/10 text-white/70 px-2 py-0.5 text-xs">
                  +{project.tags.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* Footer: Developer & Links */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>By</span>
              <a
                href={`/${project.developer.username}`}
                onClick={(e) => e.stopPropagation()}
                className="text-white/80 hover:text-white transition-colors font-medium"
              >
                @{project.developer.username}
              </a>
            </div>

            <div className="flex gap-2">
              {project.repoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(project.repoUrl, '_blank');
                  }}
                  className="h-7 px-2 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white"
                  title="View Repository"
                >
                  <Github className="h-3.5 w-3.5" />
                </Button>
              )}
              {project.demoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(project.demoUrl, '_blank');
                  }}
                  className="h-7 px-2 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white"
                  title="View Demo"
                >
                  <Globe className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

