import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { getCurrentUser, getDeveloperProfile } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
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
    if (!developer.walrus_blob_id) {
      return new Response(
        JSON.stringify({ error: 'No Walrus blob found to remove' }),
        { status: 400 }
      );
    }

    // Clear Walrus-related fields (walrus_blob_id and blob_object_id)
    // This converts the profile from onchain to offchain mode
    const { error: updateError } = await supabase
      .from('developers')
      .update({
        walrus_blob_id: null,
        blob_object_id: null,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[handle-walrus-expiration] Database update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update database' }),
        { status: 500 }
      );
    }

    console.log('[handle-walrus-expiration] Successfully removed expired Walrus blob for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Expired Walrus blob removed successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[handle-walrus-expiration] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500 }
    );
  }
};

