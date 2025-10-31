import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Upload avatar from file and save to public/avatar/
 * @param fileBuffer - File buffer
 * @param filename - Original filename
 * @param username - Username to use in saved filename
 * @returns Local path to saved avatar
 */
export async function uploadAvatar(
  fileBuffer: Buffer,
  filename: string,
  username: string
): Promise<string> {
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
 * Delete old avatar file
 * @param avatarPath - Path to avatar file (e.g., /avatar/username-avatar.png)
 */
export function deleteOldAvatar(avatarPath: string): void {
  try {
    if (!avatarPath || !avatarPath.startsWith('/avatar/')) {
      return;
    }

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
 * Upload project image and save to public/projects/
 * @param fileBuffer - File buffer
 * @param filename - Original filename
 * @param projectId - Project ID to use in saved filename
 * @returns Local path to saved image
 */
export async function uploadProjectImage(
  fileBuffer: Buffer,
  filename: string,
  projectId: string
): Promise<string> {
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
 * Delete project image file
 * @param imagePath - Path to image file (e.g., /projects/projectId-timestamp.png)
 */
export function deleteProjectImage(imagePath: string): void {
  try {
    if (!imagePath || !imagePath.startsWith('/projects/')) {
      return;
    }

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

