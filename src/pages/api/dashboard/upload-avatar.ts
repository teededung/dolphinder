import type { APIRoute } from 'astro';
import { uploadAvatar, deleteOldAvatar } from '../../../lib/media-upload';
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

    // Parse form data
    const formData = await request.formData();
    const avatarFile = formData.get('avatar') as File | null;

    if (!avatarFile || avatarFile.size === 0) {
      return new Response(
        JSON.stringify({ error: 'No avatar file provided' }),
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (avatarFile.size > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Avatar file size must be less than 5MB' }),
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(avatarFile.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Supported: JPG, PNG, GIF, WebP' }),
        { status: 400 }
      );
    }

    try {
      // Convert file to buffer
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      
      // Upload new avatar - pass supabase client and userId for Supabase Storage
      const newAvatarPath = await uploadAvatar(
        buffer, 
        avatarFile.name, 
        developer.username,
        supabase,
        user.id
      );
      
      // Delete old avatar if exists
      if (developer.avatar) {
        await deleteOldAvatar(developer.avatar, supabase);
      }

      // Update database
      const { error: updateError } = await supabase
        .from('developers')
        .update({ avatar: newAvatarPath })
        .eq('id', developer.id);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          avatarPath: newAvatarPath,
          message: 'Avatar updated successfully',
        }),
        { status: 200 }
      );
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to upload avatar' }),
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    );
  }
};

