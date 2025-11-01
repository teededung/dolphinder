import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { SupabaseClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if running on serverless (Netlify, Vercel, etc.)
// On serverless, filesystem writes are not allowed, so we use Supabase Storage
const isServerless = typeof process !== 'undefined' && 
  (process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env._HANDLER);

/**
 * Download avatar from external URL and save to public/avatar/
 * @param url - External URL of the avatar
 * @param username - Username to use in filename
 * @returns Local path to saved avatar (e.g., /avatar/username-avatar.png)
 */
export async function downloadAvatar(url: string, username: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download avatar: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    const ext = getExtensionFromContentType(contentType);
    
    const filename = `${username}-avatar.${ext}`;
    const publicDir = path.join(__dirname, '../../public/avatar');
    const filePath = path.join(publicDir, filename);

    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Save file
    fs.writeFileSync(filePath, Buffer.from(buffer));

    return `/avatar/${filename}`;
  } catch (error) {
    console.error(`Error downloading avatar for ${username}:`, error);
    throw error;
  }
}

/**
 * Upload avatar to Supabase Storage
 * @param supabase - Supabase client instance
 * @param fileBuffer - File buffer
 * @param filename - Original filename
 * @param username - Username to use in saved filename
 * @param userId - User ID for folder organization
 * @returns Public URL to uploaded avatar
 */
export async function uploadAvatarToStorage(
  supabase: SupabaseClient,
  fileBuffer: Buffer,
  filename: string,
  username: string,
  userId: string
): Promise<string> {
  try {
    const ext = path.extname(filename).toLowerCase().replace('.', '') || 'png';
    const timestamp = Date.now();
    const newFilename = `${username}-${timestamp}.${ext}`;
    
    // Use userId to organize files in storage
    const storagePath = `${userId}/${newFilename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(storagePath, fileBuffer, {
        contentType: `image/${ext}`,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload to Supabase Storage: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error(`Error uploading avatar to storage for ${username}:`, error);
    throw error;
  }
}

/**
 * Upload avatar from file and save to public/avatar/
 * @param fileBuffer - File buffer
 * @param filename - Original filename
 * @param username - Username to use in saved filename
 * @param supabase - Optional Supabase client (preferred for serverless)
 * @param userId - Optional user ID (required when using Supabase Storage)
 * @returns Local path or public URL to saved avatar
 */
export async function uploadAvatar(
  fileBuffer: Buffer,
  filename: string,
  username: string,
  supabase?: SupabaseClient,
  userId?: string
): Promise<string> {
  // Prefer Supabase Storage if client and userId are provided
  // This works on both serverless and local dev
  if (supabase && userId) {
    try {
      return await uploadAvatarToStorage(supabase, fileBuffer, filename, username, userId);
    } catch (error: any) {
      // If Supabase Storage fails and we're not on serverless, fallback to filesystem
      if (!isServerless) {
        console.warn('Supabase Storage upload failed, falling back to filesystem:', error.message);
      } else {
        // On serverless, we must use Supabase Storage
        throw error;
      }
    }
  }

  // Fallback to filesystem (local development only)
  if (isServerless) {
    throw new Error('Supabase client and userId are required for serverless uploads');
  }

  try {
    const ext = path.extname(filename).toLowerCase().replace('.', '') || 'png';
    const timestamp = Date.now();
    const newFilename = `${username}-${timestamp}.${ext}`;
    
    const publicDir = path.join(__dirname, '../../public/avatar');
    const filePath = path.join(publicDir, newFilename);

    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Save file
    fs.writeFileSync(filePath, fileBuffer);

    return `/avatar/${newFilename}`;
  } catch (error) {
    console.error(`Error uploading avatar for ${username}:`, error);
    throw error;
  }
}

/**
 * Delete avatar from Supabase Storage
 * @param supabase - Supabase client instance
 * @param avatarUrl - Full URL to the avatar in Supabase Storage
 */
export async function deleteAvatarFromStorage(
  supabase: SupabaseClient,
  avatarUrl: string
): Promise<void> {
  try {
    // Extract path from Supabase Storage URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/avatars/<path>
    const urlMatch = avatarUrl.match(/\/avatars\/(.+)$/);
    if (!urlMatch) {
      console.warn(`Invalid Supabase Storage URL format: ${avatarUrl}`);
      return;
    }

    const storagePath = urlMatch[1];

    const { error } = await supabase.storage
      .from('avatars')
      .remove([storagePath]);

    if (error) {
      console.error(`Error deleting avatar from storage: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error deleting avatar ${avatarUrl}:`, error);
    // Don't throw - deleting old avatar is not critical
  }
}

/**
 * Delete old avatar file - handles both filesystem and Supabase Storage
 * @param avatarPath - Path to avatar file (e.g., /avatar/username-avatar.png) or Supabase Storage URL
 * @param supabase - Optional Supabase client (required for serverless)
 */
export async function deleteOldAvatar(
  avatarPath: string,
  supabase?: SupabaseClient
): Promise<void> {
  // If it's a Supabase Storage URL (starts with http/https)
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    if (!supabase) {
      console.warn('Cannot delete from Supabase Storage: Supabase client not provided');
      return;
    }
    await deleteAvatarFromStorage(supabase, avatarPath);
    return;
  }

  // Local filesystem path
  if (!avatarPath.startsWith('/avatar/')) {
    return;
  }

  // Only try filesystem delete if not on serverless
  if (isServerless) {
    console.warn('Cannot delete from filesystem on serverless environment');
    return;
  }

  try {
    const filename = path.basename(avatarPath);
    const publicDir = path.join(__dirname, '../../public/avatar');
    const filePath = path.join(publicDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Error deleting avatar ${avatarPath}:`, error);
    // Don't throw - deleting old avatar is not critical
  }
}

/**
 * Check if avatar path is external URL
 */
export function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Sanitize project ID for use in filename
 */
function sanitizeProjectId(projectId: string): string {
  // Remove hyphens and take first 8 chars to keep filename short
  const sanitized = projectId.replace(/-/g, '').slice(0, 8);
  // Add random suffix to avoid collisions
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${sanitized}${randomSuffix}`;
}

/**
 * Upload project image to Supabase Storage
 * @param supabase - Supabase client instance
 * @param fileBuffer - File buffer
 * @param filename - Original filename
 * @param projectId - Project ID to use in saved filename
 * @param userId - User ID for folder organization
 * @returns Public URL to uploaded image
 */
export async function uploadProjectImageToStorage(
  supabase: SupabaseClient,
  fileBuffer: Buffer,
  filename: string,
  projectId: string,
  userId: string
): Promise<string> {
  try {
    const ext = path.extname(filename).toLowerCase().replace('.', '') || 'png';
    const timestamp = Date.now();
    // Sanitize projectId to avoid long filenames
    const sanitizedId = sanitizeProjectId(projectId);
    const newFilename = `${sanitizedId}-${timestamp}.${ext}`;
    
    // Use userId to organize files in storage
    const storagePath = `${userId}/${newFilename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('projects')
      .upload(storagePath, fileBuffer, {
        contentType: `image/${ext}`,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload to Supabase Storage: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('projects')
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error(`Error uploading project image to storage for ${projectId}:`, error);
    throw error;
  }
}

/**
 * Upload project image - uses Supabase Storage when available, filesystem as fallback
 * @param fileBuffer - File buffer
 * @param filename - Original filename
 * @param projectId - Project ID to use in saved filename
 * @param supabase - Optional Supabase client (preferred for serverless)
 * @param userId - Optional user ID (required when using Supabase Storage)
 * @returns Local path or public URL to saved image
 */
export async function uploadProjectImage(
  fileBuffer: Buffer,
  filename: string,
  projectId: string,
  supabase?: SupabaseClient,
  userId?: string
): Promise<string> {
  // Prefer Supabase Storage if client and userId are provided
  // This works on both serverless and local dev
  if (supabase && userId) {
    try {
      return await uploadProjectImageToStorage(supabase, fileBuffer, filename, projectId, userId);
    } catch (error: any) {
      // If Supabase Storage fails and we're not on serverless, fallback to filesystem
      if (!isServerless) {
        console.warn('Supabase Storage upload failed, falling back to filesystem:', error.message);
      } else {
        // On serverless, we must use Supabase Storage
        throw error;
      }
    }
  }

  // Fallback to filesystem (local development only)
  if (isServerless) {
    throw new Error('Supabase client and userId are required for serverless uploads');
  }

  try {
    const ext = path.extname(filename).toLowerCase().replace('.', '') || 'png';
    const timestamp = Date.now();
    // Sanitize projectId to avoid long filenames
    const sanitizedId = sanitizeProjectId(projectId);
    const newFilename = `${sanitizedId}-${timestamp}.${ext}`;
    
    const publicDir = path.join(__dirname, '../../public/projects');
    const filePath = path.join(publicDir, newFilename);

    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Save file
    fs.writeFileSync(filePath, fileBuffer);

    return `/projects/${newFilename}`;
  } catch (error) {
    console.error(`Error uploading project image for ${projectId}:`, error);
    throw error;
  }
}

/**
 * Delete project image from Supabase Storage
 * @param supabase - Supabase client instance
 * @param imageUrl - Full URL to the image in Supabase Storage
 */
export async function deleteProjectImageFromStorage(
  supabase: SupabaseClient,
  imageUrl: string
): Promise<void> {
  try {
    // Extract path from Supabase Storage URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/projects/<path>
    const urlMatch = imageUrl.match(/\/projects\/(.+)$/);
    if (!urlMatch) {
      console.warn(`Invalid Supabase Storage URL format: ${imageUrl}`);
      return;
    }

    const storagePath = urlMatch[1];

    const { error } = await supabase.storage
      .from('projects')
      .remove([storagePath]);

    if (error) {
      console.error(`Error deleting project image from storage: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error deleting project image ${imageUrl}:`, error);
    // Don't throw - deleting old image is not critical
  }
}

/**
 * Delete project image file - handles both filesystem and Supabase Storage
 * @param imagePath - Path to image file (e.g., /projects/projectId-timestamp.png) or Supabase Storage URL
 * @param supabase - Optional Supabase client (required for serverless)
 */
export async function deleteProjectImage(
  imagePath: string,
  supabase?: SupabaseClient
): Promise<void> {
  // If it's a Supabase Storage URL (starts with http/https)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    if (!supabase) {
      console.warn('Cannot delete from Supabase Storage: Supabase client not provided');
      return;
    }
    await deleteProjectImageFromStorage(supabase, imagePath);
    return;
  }

  // Local filesystem path
  if (!imagePath.startsWith('/projects/')) {
    return;
  }

  // Only try filesystem delete if not on serverless
  if (isServerless) {
    console.warn('Cannot delete from filesystem on serverless environment');
    return;
  }

  try {
    const filename = path.basename(imagePath);
    const publicDir = path.join(__dirname, '../../public/projects');
    const filePath = path.join(publicDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Error deleting project image ${imagePath}:`, error);
    // Don't throw - deleting old image is not critical
  }
}

/**
 * Get file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return map[contentType] || 'png';
}

