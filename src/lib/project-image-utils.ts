/**
 * Shared utilities for project image URLs
 * Prioritizes Walrus storage over localhost fallback
 */

import type { ProjectImage } from '../types/project';
import { getQuiltPatchUrl } from './walrus-quilt';
import { getWalrusImageUrl } from './walrus';

/**
 * Get image URL from project image (prioritize Walrus)
 * 
 * Priority order:
 * 1. blobId (direct Walrus blob)
 * 2. quiltPatchId (Walrus quilt patch via HTTP API)
 * 3. filename (localhost fallback)
 * 
 * @param image - Project image (string or ProjectImage object)
 * @returns Image URL or null if no valid source found
 */
export function getProjectImageUrl(image: string | ProjectImage): string | null {
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

/**
 * Check if image is stored on Walrus (has blobId or quiltPatchId)
 */
export function isImageOnWalrus(image: string | ProjectImage): boolean {
  if (typeof image === 'string') {
    return false;
  }
  
  return !!(image.blobId || image.quiltPatchId);
}

