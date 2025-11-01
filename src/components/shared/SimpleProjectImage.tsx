import { useState, useEffect, useRef } from 'react';
import { ProjectImagePlaceholder } from './ProjectImagePlaceholder';
import type { ProjectImage } from '../../types/project';
import { getProjectImageUrl } from '../../lib/project-image-utils';

interface SimpleProjectImageProps {
  image: string | ProjectImage;
  projectName: string;
  imgIdx: number;
  className?: string;
  showWalrusBadge?: boolean;
  onClick?: () => void;
}

/**
 * Simple project image component with fallback to placeholder
 * No complex caching logic - just render <img> directly like ProjectsManager does
 */
export default function SimpleProjectImage({ 
  image,
  projectName, 
  imgIdx,
  className = 'h-full w-full object-cover',
  showWalrusBadge = true,
  onClick
}: SimpleProjectImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // Get image URL (prioritizes Walrus)
  const imgSrc = getProjectImageUrl(image);
  
  // Check if image is on Walrus
  const isProjectImage = typeof image === 'object';
  const hasWalrus = isProjectImage && !!(image.quiltPatchId || image.blobId);

  // Check if image is already loaded (cached by browser)
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      // Image is already loaded (from cache)
      setIsLoading(false);
    }
  }, [imgSrc]);

  if (imageError || !imgSrc) {
    return (
      <div className={className}>
        <ProjectImagePlaceholder size="md" className="w-full h-full" />
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full h-full ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60"></div>
        </div>
      )}
      <img
        ref={imgRef}
        src={imgSrc}
        alt={`${projectName} - Image ${imgIdx + 1}`}
        className={className}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          console.error(`Failed to load image: ${imgSrc}`);
          setIsLoading(false);
          setImageError(true);
        }}
      />
      {hasWalrus && showWalrusBadge && !imageError && !isLoading && (
        <div className="absolute top-1 right-1 bg-emerald-500/80 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
          Walrus
        </div>
      )}
    </div>
  );
}

