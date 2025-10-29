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

    // Clear Walrus-related fields and wallet address in Supabase
    // This removes the on-chain references and unbinds the wallet
    // The blob data remains on Walrus storage (immutable) but is no longer linked to this profile
    const { error: updateError } = await supabase
      .from('developers')
      .update({
        walrus_blob_id: null,
        blob_object_id: null,
        slush_wallet: null,
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

