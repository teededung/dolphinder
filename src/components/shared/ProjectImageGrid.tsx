import { useState, useEffect, useRef } from 'react';
import type { ProjectImage } from '@/types/project';
import { getQuiltPatchUrl } from '@/lib/walrus-quilt';
import { getWalrusImageUrl } from '@/lib/walrus';
import { readWalrusFile, createBlobUrl, isWalrusSDKAvailable } from '@/lib/walrus-sdk';
import { ProjectImagePlaceholder } from './ProjectImagePlaceholder';

// Global cache for loaded images (persists across component re-renders)
const imageCache = new Map<string, ImageWithSource>();

interface ProjectImageGridProps {
  images: (string | ProjectImage)[];
  projectName: string;
  walrusQuiltId?: string; // Walrus quilt ID for the project (needed to fetch quilt patches)
  onImageClick?: (imgSrc: string) => void;
  getImageUrl: (image: string | ProjectImage) => string | null;
  maxImages?: number;
  variant?: 'compact' | 'default' | 'list'; // 'list' for showcase list view
  showWalrusBadge?: boolean; // Show Walrus badge (default: true)
}

interface ImageWithSource {
  original: string | ProjectImage;
  source: string;
  isWalrus: boolean;
}

/**
 * Unified grid layout for project images
 * - Prioritizes Walrus (onchain) images via quiltPatchId + walrusQuiltId
 * - Falls back to localhost if Walrus unavailable
 * - 1-2 images: larger display
 * - 3+ images: consistent 3-column grid
 * - Automatically filters out broken/missing images
 */
export default function ProjectImageGrid({
  images,
  projectName,
  walrusQuiltId,
  onImageClick,
  getImageUrl,
  maxImages = 5,
  variant = 'default',
  showWalrusBadge = true
}: ProjectImageGridProps) {
  const [validImages, setValidImages] = useState<ImageWithSource[]>([]);
  const [isChecking, setIsChecking] = useState(true);
  const [blobUrls, setBlobUrls] = useState<string[]>([]); // Track blob URLs for cleanup

  // Check which images are actually valid/accessible, prioritizing Walrus
  useEffect(() => {
    const checkImages = async () => {
      const displayImages = images.slice(0, maxImages);
      const checks = await Promise.all(
        displayImages.map(async (img): Promise<ImageWithSource | null> => {
          // Generate cache key
          const cacheKey = typeof img === 'string' 
            ? img 
            : (img.blobId || img.quiltPatchId || img.filename || JSON.stringify(img));
          
          // Check cache first to avoid re-fetching
          if (cacheKey && imageCache.has(cacheKey)) {
            return imageCache.get(cacheKey)!;
          }
          
          // Check if image has blobId or quiltPatchId (Walrus onchain storage)
          const hasBlobId = typeof img !== 'string' && !!(img as ProjectImage).blobId;
          const hasQuiltPatch = typeof img !== 'string' && !!(img as ProjectImage).quiltPatchId;
          
          // Priority 1a: Try Walrus blob first (individual image as blob)
          if (hasBlobId) {
            try {
              const blobId = (img as ProjectImage).blobId!;
              const walrusUrl = getWalrusImageUrl(blobId);
              
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);
              
              const response = await fetch(walrusUrl, { 
                method: 'GET',
                signal: controller.signal,
                cache: 'no-cache',
                mode: 'cors',
              });
              
              clearTimeout(timeoutId);
              
              if (response.ok) {
                const contentType = response.headers.get('content-type') || '';
                console.log('[ProjectImageGrid] Walrus blob response content-type:', contentType);
                if (contentType.startsWith('image/') || contentType.startsWith('application/octet-stream')) {
                  console.log('[ProjectImageGrid] ✓ Using Walrus blob:', blobId);
                  return {
                    original: img,
                    source: walrusUrl,
                    isWalrus: true
                  };
                } else {
                  console.log('[ProjectImageGrid] ✗ Walrus blob response is not an image (content-type:', contentType, ')');
                }
              } else {
                console.log('[ProjectImageGrid] ✗ Walrus blob not accessible (HTTP', response.status, '):', blobId);
              }
            } catch (e: any) {
              if (e.name === 'AbortError') {
                console.log('[ProjectImageGrid] ✗ Walrus blob fetch timeout (>10s)');
              } else {
                console.log('[ProjectImageGrid] ✗ Walrus blob fetch error:', e?.message || e);
              }
            }
          }
          
          // Priority 1b: Try Walrus quilt patch (HTTP API first, then SDK fallback)
          if (hasQuiltPatch) {
            const quiltPatchId = (img as ProjectImage).quiltPatchId!;
            
            // Try HTTP API first (faster, no WASM needed)
            try {
              const quiltPatchUrl = getQuiltPatchUrl(quiltPatchId);
              
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);
              
              const response = await fetch(quiltPatchUrl, {
                method: 'GET',
                signal: controller.signal,
                cache: 'no-cache',
                mode: 'cors',
              });
              
              clearTimeout(timeoutId);
              
              if (response.ok) {
                const contentType = response.headers.get('content-type') || '';
                if (contentType.startsWith('image/') || contentType.startsWith('application/octet-stream')) {
                  const result: ImageWithSource = {
                    original: img,
                    source: quiltPatchUrl,
                    isWalrus: true
                  };
                  
                  // Cache successful load
                  if (cacheKey) {
                    imageCache.set(cacheKey, result);
                  }
                  
                  console.log('[Walrus HTTP] ✓ Loaded quilt patch:', quiltPatchId.slice(0, 16) + '...');
                  return result;
                }
              }
            } catch (e: any) {
              // HTTP API failed, try SDK fallback
            }
            
            // Fallback: Try SDK (requires WASM, but full quilt support)
            try {
              if (isWalrusSDKAvailable()) {
                const fileBytes = await readWalrusFile(quiltPatchId);
                
                if (fileBytes) {
                  const metadata = typeof img !== 'string' ? img.metadata : undefined;
                  const format = metadata?.format || 'jpeg';
                  const contentType = `image/${format}`;
                  
                  const blobUrl = createBlobUrl(fileBytes, contentType);
                  setBlobUrls(prev => [...prev, blobUrl]);
                  
                  const result: ImageWithSource = {
                    original: img,
                    source: blobUrl,
                    isWalrus: true
                  };
                  
                  if (cacheKey) {
                    imageCache.set(cacheKey, result);
                  }
                  
                  console.log('[Walrus SDK] ✓ Loaded quilt patch (SDK fallback):', quiltPatchId.slice(0, 16) + '...');
                  return result;
                }
              }
            } catch (e: any) {
              // Both HTTP and SDK failed, will try localhost
            }
          }
          
          // Priority 2: Fallback to localhost
          const localUrl = getImageUrl(img);
          if (localUrl) {
            try {
              const response = await fetch(localUrl, { method: 'HEAD' });
              if (response.ok) {
                const result: ImageWithSource = {
                  original: img,
                  source: localUrl,
                  isWalrus: false
                };
                
                // Cache successful load
                if (cacheKey) {
                  imageCache.set(cacheKey, result);
                }
                
                return result;
              }
            } catch (e) {
              // Silent fail
            }
          }
          
          return null;
        })
      );
      
      const valid = checks.filter((img): img is ImageWithSource => img !== null);
      const walrusCount = valid.filter(v => v.isWalrus).length;
      const localhostCount = valid.filter(v => !v.isWalrus).length;
      
      if (walrusCount > 0 || localhostCount > 0) {
        console.log(`[Images] ✓ Loaded ${valid.length}/${displayImages.length} (${walrusCount} Walrus, ${localhostCount} local) | Cache size: ${imageCache.size}`);
      }
      
      setValidImages(valid);
      setIsChecking(false);
    };
    
    checkImages();
  }, [images, maxImages, getImageUrl, walrusQuiltId]);
  
  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      blobUrls.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // Silent cleanup
        }
      });
    };
  }, [blobUrls]);
  
  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="w-full flex items-center justify-center py-4">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60"></div>
      </div>
    );
  }
  
  // No valid images found - show placeholder
  if (validImages.length === 0) {
    return (
      <div className="w-full flex items-center justify-center">
        <ProjectImagePlaceholder size="md" />
      </div>
    );
  }

  // Component for rendering individual image with error handling
  const ImageWithFallback = ({ imgWithSource, imgIdx }: { imgWithSource: ImageWithSource; imgIdx: number }) => {
    const { source, isWalrus, original } = imgWithSource;
    const localFallback = getImageUrl(original);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Show placeholder if image failed to load
    if (imageError) {
      return <ProjectImagePlaceholder size="md" className="w-full h-full" />;
    }

    return (
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60"></div>
          </div>
        )}
        <img
          src={source}
          alt={`${projectName} - Image ${imgIdx + 1}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onLoad={() => setIsLoading(false)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            
            // Check if we already tried fallback (prevent infinite loop)
            const alreadyTriedFallback = target.dataset.triedFallback === 'true';
            
            if (alreadyTriedFallback) {
              // Already tried fallback and still failed, show placeholder
              console.warn('[ProjectImageGrid] ✗ Both Walrus and localhost failed, showing placeholder');
              setIsLoading(false);
              setImageError(true);
              return;
            }
            
            // If Walrus failed and we have a local fallback, try it ONCE
            if (isWalrus && localFallback && target.src !== localFallback) {
              target.dataset.triedFallback = 'true'; // Mark that we tried fallback
              target.src = localFallback;
              return;
            }
            
            // No fallback available, show placeholder
            setIsLoading(false);
            setImageError(true);
          }}
        />
        {/* Walrus badge indicator */}
        {isWalrus && showWalrusBadge && !imageError && !isLoading && (
          <div className="absolute top-1 right-1 bg-emerald-500/80 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            Walrus
          </div>
        )}
      </div>
    );
  };

  // Render single image button
  const renderImageButton = (imgWithSource: ImageWithSource, imgIdx: number, className: string, isListVariant = false) => {
    return (
      <button
        key={imgIdx}
        type="button"
        className={`relative overflow-hidden transition-all group ${
          isListVariant 
            ? '' // No border/rounded for list variant to allow images to fill completely
            : 'rounded-lg border border-white/10 hover:border-white/20'
        } ${className}`}
        onClick={() => {
          if (onImageClick) {
            onImageClick(imgWithSource.source);
          }
        }}
      >
        <ImageWithFallback imgWithSource={imgWithSource} imgIdx={imgIdx} />
      </button>
    );
  };

  // Layout logic - use validImages
  const imageCount = validImages.length;

  // List variant: horizontal layout with no gap (for 1, 2, or 3+ images)
  if (variant === 'list') {
    return (
      <div className={`h-full w-full ${
        imageCount === 1 ? 'grid grid-cols-1' :
        imageCount === 2 ? 'grid grid-cols-2' :
        'grid grid-cols-3'
      }`}>
        {validImages.map((img, idx) => 
          renderImageButton(img, idx, 'h-full w-full', true)
        )}
      </div>
    );
  }

  // Single image: full width
  if (imageCount === 1) {
    return (
      <div className="w-full">
        {renderImageButton(validImages[0], 0, 'aspect-video w-full')}
      </div>
    );
  }

  // Two images: side by side
  if (imageCount === 2) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {validImages.map((img, idx) => 
          renderImageButton(img, idx, variant === 'compact' ? 'aspect-video' : 'aspect-square')
        )}
      </div>
    );
  }
  
  // Default: 3-column grid
  return (
    <div className="grid grid-cols-3 gap-2">
      {validImages.map((img, idx) => 
        renderImageButton(img, idx, 'aspect-square')
      )}
    </div>
  );
}
