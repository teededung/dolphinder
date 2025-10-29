import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { getCurrentUser, getDeveloperProfile } from '../../../lib/auth';
import { uploadJson } from '../../../lib/walrus';
import { getDevIdByUsername } from '../../../lib/sui-views';

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

    // Check if wallet is bound
    if (!developer.slush_wallet) {
      return new Response(
        JSON.stringify({ error: 'Please bind a Sui wallet before pushing to Walrus' }),
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { walrusData, profileFields, txDigest } = body;

    if (!walrusData || !profileFields || !txDigest) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: walrusData, profileFields, txDigest' }),
        { status: 400 }
      );
    }

    // Verify transaction succeeded by checking if devId exists onchain
    const devId = await getDevIdByUsername(developer.username);
    if (!devId) {
      return new Response(
        JSON.stringify({ error: 'Transaction not confirmed onchain yet. Please try again.' }),
        { status: 400 }
      );
    }

    // Extract blobId and blobObjectId from walrusData (already uploaded to Walrus by client)
    const blobId = walrusData.blobId;
    const blobObjectId = walrusData.blobObjectId; // Sui object ID from Walrus upload response
    
    if (!blobId || typeof blobId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid blobId in walrusData' }),
        { status: 400 }
      );
    }

    // Prepare update data with Walrus info and profile fields
    const updateData: any = { 
      walrus_blob_id: blobId,
      // Update all profile fields
      name: profileFields.name?.trim() || developer.name,
      bio: profileFields.bio?.trim() || null,
      entry: profileFields.entry?.trim() || null,
      github: profileFields.github?.trim() || null,
      linkedin: profileFields.linkedin?.trim() || null,
      telegram: profileFields.telegram?.trim() || null,
      website: profileFields.website?.trim() || null,
      avatar: profileFields.avatar?.trim() || null,
      projects: profileFields.projects || [],
      certificates: profileFields.certificates || [],
    };
    
    if (blobObjectId && typeof blobObjectId === 'string') {
      updateData.blob_object_id = blobObjectId;
      console.log('[push-walrus] Saving blob_object_id for metadata queries:', blobObjectId);
    }
    
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
        message: 'Profile pushed to Walrus successfully',
        blobId,
        txDigest,
      }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Walrus push error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    );
  }
};

