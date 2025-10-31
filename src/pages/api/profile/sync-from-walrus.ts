import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { getCurrentUser, getDeveloperProfile } from '../../../lib/auth';
import { fetchJson } from '../../../lib/walrus';
import { uploadAvatar, deleteOldAvatar } from '../../../lib/media-upload';
import type { ProfileData } from '../../../types/developer';

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

    // Parse request body
    const body = await request.json();
    const { walrusBlobId } = body;

    if (!walrusBlobId) {
      return new Response(
        JSON.stringify({ error: 'walrusBlobId is required' }),
        { status: 400 }
      );
    }

    // Fetch data from Walrus
    console.log('[Sync from Walrus] Fetching blob:', walrusBlobId);
    const onchainData = await fetchJson<ProfileData>(walrusBlobId);

    if (!onchainData || !onchainData.profile) {
      return new Response(
        JSON.stringify({ error: 'Invalid data format from Walrus' }),
        { status: 400 }
      );
    }

    console.log('[Sync from Walrus] Fetched data:', {
      ...onchainData,
      profile: {
        ...onchainData.profile,
        avatar: onchainData.profile.avatar?.startsWith('data:')
          ? `${onchainData.profile.avatar.slice(0, 50)}... (base64)`
          : onchainData.profile.avatar,
      }
    });

    // Prepare update data
    const updateData: any = {
      name: onchainData.profile.name,
      bio: onchainData.profile.bio || null,
      entry: onchainData.profile.entry || null,
      github: onchainData.profile.github || null,
      linkedin: onchainData.profile.linkedin || null,
      telegram: onchainData.profile.telegram || null,
      website: onchainData.profile.website || null,
      projects: onchainData.projects || [],
      certificates: onchainData.certificates || [],
    };

    // Handle avatar conversion from base64 to file
    if (onchainData.profile.avatar) {
      const avatarData = onchainData.profile.avatar;
      
      // Check if avatar is base64 encoded
      if (avatarData.startsWith('data:')) {
        try {
          console.log('[Sync from Walrus] Converting base64 avatar to file...');
          
          // Extract base64 data and mime type
          const matches = avatarData.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            
            // Convert base64 to buffer
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Determine file extension from mime type
            const ext = mimeType.split('/')[1] || 'jpg';
            const filename = `${developer.username}-avatar.${ext}`;
            
            // Upload as local file
            const newAvatarPath = await uploadAvatar(buffer, filename, developer.username);
            
            // Delete old avatar if exists
            if (developer.avatar) {
              deleteOldAvatar(developer.avatar);
            }
            
            updateData.avatar = newAvatarPath;
            console.log('[Sync from Walrus] Avatar converted and saved:', newAvatarPath);
          } else {
            console.warn('[Sync from Walrus] Invalid base64 format, keeping as-is');
            updateData.avatar = avatarData;
          }
        } catch (avatarError: any) {
          console.error('[Sync from Walrus] Avatar conversion error:', avatarError);
          // Keep original avatar on error
          updateData.avatar = developer.avatar;
        }
      } else {
        // Avatar is already a URL/path, use as-is
        updateData.avatar = avatarData;
      }
    }

    // Update developer profile in database
    const { error: updateError } = await supabase
      .from('developers')
      .update(updateData)
      .eq('id', developer.id);

    if (updateError) {
      throw updateError;
    }

    console.log('[Sync from Walrus] Profile updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Profile synced from Walrus successfully',
      }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[Sync from Walrus] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to sync from Walrus' }),
      { status: 500 }
    );
  }
};

