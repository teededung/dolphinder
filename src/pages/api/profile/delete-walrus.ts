import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { getCurrentUser, getDeveloperProfile } from '../../../lib/auth';

export const prerender = false;

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

    // Get developer profile
    const developer = await getDeveloperProfile(supabase, user.id);
    if (!developer) {
      return new Response(
        JSON.stringify({ error: 'Developer profile not found' }),
        { status: 404 }
      );
    }

    // Check if developer has walrus blob
    if (!developer.walrus_blob_id || !developer.blob_object_id) {
      return new Response(
        JSON.stringify({ error: 'No Walrus blob found to delete' }),
        { status: 400 }
      );
    }

    // Clean Walrus metadata from projects
    // Remove walrusQuiltId from projects and quiltPatchId/blobId from images
    const cleanedProjects = (developer.projects || []).map((project: any) => {
      // Remove walrusQuiltId from project
      const { walrusQuiltId, ...projectWithoutWalrus } = project;
      
      // Clean Walrus metadata from images
      if (project.images && Array.isArray(project.images)) {
        projectWithoutWalrus.images = project.images.map((img: any) => {
          // If it's a string, keep as is (old format)
          if (typeof img === 'string') {
            return img;
          }
          
          // If it's an object, remove Walrus fields
          if (typeof img === 'object' && img !== null) {
            const { quiltPatchId, blobId, ...imgWithoutWalrus } = img;
            
            // If only Walrus fields exist and no filename/localPath, skip this image
            if (!imgWithoutWalrus.filename && !imgWithoutWalrus.localPath) {
              return null;
            }
            
            return imgWithoutWalrus;
          }
          
          return img;
        }).filter(Boolean); // Remove null images
      }
      
      return projectWithoutWalrus;
    });

    // Clear Walrus-related fields, wallet address, and update projects in Supabase
    // This removes the on-chain references and unbinds the wallet
    // The blob data remains on Walrus storage (immutable) but is no longer linked to this profile
    const { error: updateError } = await supabase
      .from('developers')
      .update({
        walrus_blob_id: null,
        blob_object_id: null,
        slush_wallet: null,
        projects: cleanedProjects,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[delete-walrus] Database update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update database' }),
        { status: 500 }
      );
    }

    console.log('[delete-walrus] Successfully cleared Walrus references for user:', user.id);
    console.log('[delete-walrus] Cleaned projects count:', cleanedProjects.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Walrus blob reference cleared successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[delete-walrus] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500 }
    );
  }
};

