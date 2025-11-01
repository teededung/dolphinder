import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { getCurrentUser } from '../../../lib/auth';
import type { ProjectImage } from '../../../types/project';

export const prerender = false;

/**
 * API endpoint to delete project images from Supabase Storage
 * DELETE /api/projects/delete-images
 * Body: { images: (string | ProjectImage)[] }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerClient(cookies as any);
    
    // Check authentication
    const user = await getCurrentUser(supabase);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { images } = body;

    if (!Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Images array is required' }),
        { status: 400 }
      );
    }

    const deletedImages: string[] = [];
    const failedImages: string[] = [];

    // Delete each image from Supabase Storage
    for (const image of images) {
      try {
        let imageUrl: string | null = null;

        // Handle both string and ProjectImage format
        if (typeof image === 'string') {
          // Old format: simple string path or URL
          imageUrl = image;
        } else if (typeof image === 'object' && image !== null) {
          // New format: ProjectImage object
          const projectImage = image as ProjectImage;
          
          // Skip Walrus images (we don't delete from Walrus)
          if (projectImage.quiltPatchId || projectImage.blobId) {
            continue;
          }
          
          // Get filename for Supabase Storage
          if (projectImage.filename) {
            imageUrl = projectImage.filename;
          }
        }

        if (!imageUrl) {
          continue;
        }

        // Delete from Supabase Storage
        await deleteImageFromStorage(supabase, imageUrl, user.id);
        deletedImages.push(imageUrl);

      } catch (error: any) {
        console.error(`Failed to delete image:`, error);
        failedImages.push(typeof image === 'string' ? image : (image as any).filename || 'unknown');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Deleted ${deletedImages.length} images`,
        deletedCount: deletedImages.length,
        failedCount: failedImages.length,
        deleted: deletedImages,
        failed: failedImages,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[delete-images] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500 }
    );
  }
};

/**
 * Delete image from Supabase Storage
 */
async function deleteImageFromStorage(
  supabase: any,
  imageUrl: string,
  userId: string
): Promise<void> {
  try {
    let storagePath: string;

    // Check if it's a full Supabase Storage URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // Extract path from URL
      // Format: https://<project>.supabase.co/storage/v1/object/public/projects/<userId>/<filename>
      const urlMatch = imageUrl.match(/\/projects\/(.+)$/);
      if (!urlMatch) {
        console.warn(`Invalid Supabase Storage URL format: ${imageUrl}`);
        return;
      }
      storagePath = urlMatch[1];
    } else {
      // It's a filename or relative path
      // Remove leading slash if exists
      const filename = imageUrl.replace(/^\/+/, '');
      
      // Check if it already includes userId prefix
      if (filename.includes('/')) {
        storagePath = filename;
      } else {
        // Add userId prefix
        storagePath = `${userId}/${filename}`;
      }
    }

    console.log(`[delete-images] Attempting to delete: ${storagePath}`);

    const { error } = await supabase.storage
      .from('projects')
      .remove([storagePath]);

    if (error) {
      console.error(`Error deleting from storage: ${error.message}`);
      throw error;
    }

    console.log(`[delete-images] Successfully deleted: ${storagePath}`);
  } catch (error) {
    console.error(`Error deleting image ${imageUrl}:`, error);
    throw error;
  }
}

