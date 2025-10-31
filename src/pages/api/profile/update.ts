import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { getCurrentUser, getDeveloperProfile } from '../../../lib/auth';
import { uploadAvatar, deleteOldAvatar } from '../../../lib/media-upload';

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
    const projectsJson = formData.get('projects') as string;
    const certificatesJson = formData.get('certificates') as string;

    // Prepare update data
    const updateData: any = {};

    // Only include fields that are provided
    if (name !== null) {
      // Validate name if provided
      if (name.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Name cannot be empty' }),
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    
    if (bio !== null) updateData.bio = bio?.trim() || null;
    if (entry !== null) updateData.entry = entry?.trim() || null;
    if (github !== null) updateData.github = github?.trim() || null;
    if (linkedin !== null) updateData.linkedin = linkedin?.trim() || null;
    if (telegram !== null) updateData.telegram = telegram?.trim() || null;
    if (website !== null) updateData.website = website?.trim() || null;
    if (slush_wallet !== null) updateData.slush_wallet = slush_wallet?.trim() || null;
    
    // Handle projects and certificates (JSONB fields)
    if (projectsJson !== null) {
      try {
        updateData.projects = projectsJson ? JSON.parse(projectsJson) : [];
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid projects JSON format' }),
          { status: 400 }
        );
      }
    }
    
    if (certificatesJson !== null) {
      try {
        updateData.certificates = certificatesJson ? JSON.parse(certificatesJson) : [];
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid certificates JSON format' }),
          { status: 400 }
        );
      }
    }

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

