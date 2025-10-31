import { useState } from 'react';
import { ExternalLink, Github, Globe, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { getQuiltPatchUrl } from '@/lib/walrus-quilt';
import { ProfileAvatar } from '../shared/ProfileAvatar';
import ProjectImageGrid from '../shared/ProjectImageGrid';
import LightboxDialog from '../shared/LightboxDialog';
import type { ProjectWithDeveloper } from '@/lib/showcase';
import type { ProjectImage } from '@/types/project';

interface ProjectModalProps {
  project: ProjectWithDeveloper | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Get image URL from project image
 */
function getImageUrl(image: string | ProjectImage, project: ProjectWithDeveloper): string | null {
  if (typeof image === 'string') {
    return image;
  }
  
  if (image.filename) {
    return `/projects/${image.filename}`;
  }
  
  if (image.quiltPatchId && project.walrusQuiltId) {
    return getQuiltPatchUrl(project.walrusQuiltId, image.quiltPatchId);
  }
  
  return null;
}

export default function ProjectModal({ project, isOpen, onClose }: ProjectModalProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  if (!project) return null;

  const openLightbox = (src: string) => {
    setLightboxSrc(src);
    setLightboxOpen(true);
  };

  const images = project.images || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white flex items-center gap-2">
              {project.name}
              {project.featured && (
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Images Gallery */}
            {images.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white/80">Images</h4>
                <ProjectImageGrid
                  images={images}
                  projectName={project.name}
                  onImageClick={openLightbox}
                  getImageUrl={(img) => getImageUrl(img, project)}
                  maxImages={5}
                  variant="default"
                />
              </div>
            )}

            {/* Description */}
            {project.description && (
              <div>
                <h4 className="text-sm font-semibold text-white/80 mb-2">Description</h4>
                <p className="text-white/70 leading-relaxed">{project.description}</p>
              </div>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white/80 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-block rounded-full bg-white/10 text-white/70 px-3 py-1 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            {project.status && (
              <div>
                <h4 className="text-sm font-semibold text-white/80 mb-2">Status</h4>
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  project.status === 'active' ? 'bg-green-500/20 text-green-300' :
                  project.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {project.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>
            )}

            {/* Links */}
            {(project.repoUrl || project.demoUrl) && (
              <div>
                <h4 className="text-sm font-semibold text-white/80 mb-2">Links</h4>
                <div className="flex gap-2">
                  {project.repoUrl && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(project.repoUrl, '_blank')}
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      <Github className="h-4 w-4 mr-2" />
                      Repository
                    </Button>
                  )}
                  {project.demoUrl && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(project.demoUrl, '_blank')}
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Live Demo
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Developer Info */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-semibold text-white/80 mb-3">Developer</h4>
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  src={project.developer.avatar}
                  name={project.developer.name}
                  username={project.developer.username}
                  size={64}
                  className="border-2 border-white/20"
                />
                <div className="flex-1">
                  <a
                    href={`/${project.developer.username}`}
                    className="text-lg font-semibold text-white hover:text-white/80 transition-colors block"
                  >
                    {project.developer.name}
                  </a>
                  <a
                    href={`/${project.developer.username}`}
                    className="text-sm text-white/60 hover:text-white/80 transition-colors"
                  >
                    @{project.developer.username}
                  </a>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.open(`/${project.developer.username}`, '_blank')}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  View Profile
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Dialog */}
      <LightboxDialog
        isOpen={lightboxOpen}
        imageSrc={lightboxSrc}
        onClose={() => setLightboxOpen(false)}
        altText={project.name ? `${project.name} - Project image` : 'Project image'}
      />
    </>
  );
}

