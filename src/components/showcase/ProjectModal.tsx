import { useState } from 'react';
import { ExternalLink, Github, Globe, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { getQuiltPatchUrl } from '@/lib/walrus-quilt';
import { getWalrusImageUrl } from '@/lib/walrus';
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
 * Get image URL from project image (prioritize Walrus)
 */
function getImageUrl(image: string | ProjectImage): string | null {
  if (typeof image === 'string') {
    return image;
  }
  
  // Priority 1: blobId (direct Walrus blob)
  if (image.blobId) {
    return getWalrusImageUrl(image.blobId);
  }
  
  // Priority 2: quiltPatchId (Walrus quilt patch via HTTP API)
  if (image.quiltPatchId) {
    return getQuiltPatchUrl(image.quiltPatchId);
  }
  
  // Priority 3: filename (localhost fallback)
  if (image.filename) {
    return `/projects/${image.filename}`;
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
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] md:max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-purple-500/30 shadow-2xl shadow-purple-500/20">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-2xl text-white flex items-center gap-2">
              {project.name}
              {project.featured && (
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Images Gallery */}
            {images.length > 0 && (
              <div className="space-y-3 bg-slate-800/80 rounded-lg p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-white/90">Images</h4>
                <ProjectImageGrid
                  images={images}
                  projectName={project.name}
                  walrusQuiltId={project.walrusQuiltId}
                  onImageClick={openLightbox}
                  getImageUrl={getImageUrl}
                  maxImages={5}
                  variant="default"
                />
              </div>
            )}

            {/* Description */}
            {project.description && (
              <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-white/90 mb-2">Description</h4>
                <p className="text-white/70 leading-relaxed">{project.description}</p>
              </div>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-white/90 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-block rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3 py-1.5 text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            {project.status && (
              <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-white/90 mb-2">Status</h4>
                <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium border ${
                  project.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                  project.status === 'completed' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                  'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                }`}>
                  {project.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>
            )}

            {/* Links */}
            {(project.repoUrl || project.demoUrl) && (
              <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
                <h4 className="text-sm font-semibold text-white/90 mb-3">Links</h4>
                <div className="flex flex-wrap gap-2">
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
            <div className="bg-gradient-to-br from-purple-700 via-slate-800 to-blue-700 rounded-lg p-5 border border-purple-500/40 shadow-lg">
              <h4 className="text-sm font-semibold text-white/90 mb-4">Developer</h4>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <ProfileAvatar
                  src={project.developer.avatar}
                  name={project.developer.name}
                  username={project.developer.username}
                  size={64}
                  className="border-2 border-white/30 shadow-lg shrink-0"
                />
                <div className="flex-1 text-center sm:text-left">
                  <a
                    href={`/${project.developer.username}`}
                    className="text-lg font-semibold text-white hover:text-purple-300 transition-colors block"
                  >
                    {project.developer.name}
                  </a>
                  <a
                    href={`/${project.developer.username}`}
                    className="text-sm text-white/60 hover:text-purple-300 transition-colors"
                  >
                    @{project.developer.username}
                  </a>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.open(`/${project.developer.username}`, '_blank')}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 shrink-0"
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

