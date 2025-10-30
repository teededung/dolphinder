import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { getCurrentUser } from '../../../lib/auth';
import { uploadProjectImage } from '../../../lib/avatar';

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

    // Parse form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const projectId = formData.get('projectId') as string;

    if (!imageFile || imageFile.size === 0) {
      return new Response(
        JSON.stringify({ error: 'No image file provided' }),
        { status: 400 }
      );
    }

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID is required' }),
        { status: 400 }
      );
    }

    // Validate file size (max 3MB)
    if (imageFile.size > 3 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Image file size must be less than 3MB' }),
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Supported: JPG, PNG, GIF, WebP' }),
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Upload image
    const imagePath = await uploadProjectImage(buffer, imageFile.name, projectId);

    return new Response(
      JSON.stringify({ 
        success: true,
        imagePath,
      }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Project image upload error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    );
  }
};

