import type { ProjectImage } from '@/types/project';

interface ProjectImageGridProps {
  images: (string | ProjectImage)[];
  projectName: string;
  onImageClick?: (imgSrc: string) => void;
  getImageUrl: (image: string | ProjectImage) => string | null;
  maxImages?: number;
  variant?: 'compact' | 'default';
}

/**
 * Unified grid layout for project images
 * - 1-2 images: larger display
 * - 3+ images: consistent 3-column grid
 */
export default function ProjectImageGrid({
  images,
  projectName,
  onImageClick,
  getImageUrl,
  maxImages = 5,
  variant = 'default'
}: ProjectImageGridProps) {
  const displayImages = images.slice(0, maxImages);
  
  if (displayImages.length === 0) {
    return null;
  }

  // Render image content
  const renderImage = (img: string | ProjectImage, imgIdx: number) => {
    const imgSrc = getImageUrl(img);
    const hasQuiltPatch = typeof img !== 'string' && !!img.quiltPatchId;

    // Quilt patch without local file
    if (!imgSrc && hasQuiltPatch) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-white/5">
          <span className={`text-white/40 ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
            {img.metadata?.format?.toUpperCase() || 'IMG'}
          </span>
        </div>
      );
    }

    // No valid image source
    if (!imgSrc) return null;

    // Render actual image
    return (
      <img
        src={imgSrc}
        alt={`${projectName} - Image ${imgIdx + 1}`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    );
  };

  // Render single image button
  const renderImageButton = (img: string | ProjectImage, imgIdx: number, className: string) => {
    const imgSrc = getImageUrl(img);
    
    return (
      <button
        key={imgIdx}
        type="button"
        className={`relative overflow-hidden rounded-lg border border-white/10 hover:border-white/20 transition-all group ${className}`}
        onClick={() => {
          if (onImageClick && imgSrc) {
            onImageClick(imgSrc);
          }
        }}
      >
        {renderImage(img, imgIdx)}
      </button>
    );
  };

  // Layout logic
  const imageCount = displayImages.length;

  // Single image: full width
  if (imageCount === 1) {
    return (
      <div className="w-full">
        {renderImageButton(displayImages[0], 0, 'aspect-video w-full')}
      </div>
    );
  }

  // Two images: side by side
  if (imageCount === 2) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {displayImages.map((img, idx) => 
          renderImageButton(img, idx, variant === 'compact' ? 'aspect-video' : 'aspect-square')
        )}
      </div>
    );
  }

  // Three or more images: 3-column grid
  return (
    <div className="grid grid-cols-3 gap-2">
      {displayImages.map((img, idx) => 
        renderImageButton(img, idx, 'aspect-square')
      )}
    </div>
  );
}

