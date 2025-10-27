import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { getCurrentUser, getDeveloperProfile } from '../../../lib/auth';
import { uploadAvatar, deleteOldAvatar } from '../../../lib/avatar';

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
    
    const name = formData.get('name') as string;
    const bio = formData.get('bio') as string;
    const entry = formData.get('entry') as string;
    const github = formData.get('github') as string;
    const linkedin = formData.get('linkedin') as string;
    const telegram = formData.get('telegram') as string;
    const website = formData.get('website') as string;
    const slush_wallet = formData.get('slush_wallet') as string;
    const avatarFile = formData.get('avatar') as File | null;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Name is required' }),
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      name: name.trim(),
      bio: bio?.trim() || null,
      entry: entry?.trim() || null,
      github: github?.trim() || null,
      linkedin: linkedin?.trim() || null,
      telegram: telegram?.trim() || null,
      website: website?.trim() || null,
      slush_wallet: slush_wallet?.trim() || null,
    };

    // Handle avatar upload if provided
    if (avatarFile && avatarFile.size > 0) {
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
        
        // Upload new avatar
        const newAvatarPath = await uploadAvatar(buffer, avatarFile.name, developer.username);
        
        // Delete old avatar if exists
        if (developer.avatar) {
          deleteOldAvatar(developer.avatar);
        }

        updateData.avatar = newAvatarPath;
      } catch (error: any) {
        console.error('Avatar upload error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to upload avatar' }),
          { status: 500 }
        );
      }
    }

    // Update developer profile
    const { error: updateError } = await supabase
      .from('developers')
      .update(updateData)
      .eq('id', developer.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Profile updated successfully',
        data: updateData,
      }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Profile update error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    );
  }
};

