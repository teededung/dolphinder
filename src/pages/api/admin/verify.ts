import type { APIRoute } from 'astro';
import { createSupabaseServerClient, createSupabaseAdminClient } from '../../../lib/supabase/serverClient';
import { getCurrentUser, isAdmin } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // First, check authentication with regular client
    const supabase = createSupabaseServerClient(cookies as any);
    
    // Check authentication
    const user = await getCurrentUser(supabase);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!isAdmin(user.email)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403 }
      );
    }

    // Create admin client for database operations (bypasses RLS)
    const adminClient = createSupabaseAdminClient();

    // Parse request body
    const body = await request.json();
    const { developerId, action } = body;

    console.log('[Admin Verify] Request:', { developerId, action });

    if (!developerId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing developerId or action' }),
        { status: 400 }
      );
    }

    // Handle different actions using admin client
    if (action === 'approve') {
      // Set is_verified to true
      console.log('[Admin Verify] Approving developer:', developerId);
      
      const { data, error } = await adminClient
        .from('developers')
        .update({ is_verified: true })
        .eq('id', developerId)
        .select();

      if (error) {
        console.error('[Admin Verify] Approve error:', error);
        throw error;
      }

      console.log('[Admin Verify] Approve successful:', data);

      return new Response(
        JSON.stringify({ success: true, message: 'Developer approved' }),
        { status: 200 }
      );

    } else if (action === 'reject') {
      // Delete the developer record
      console.log('[Admin Verify] Rejecting (deleting) developer:', developerId);
      
      const { error } = await adminClient
        .from('developers')
        .delete()
        .eq('id', developerId);

      if (error) {
        console.error('[Admin Verify] Reject error:', error);
        throw error;
      }

      console.log('[Admin Verify] Reject successful');

      return new Response(
        JSON.stringify({ success: true, message: 'Developer rejected' }),
        { status: 200 }
      );

    } else if (action === 'revoke') {
      // Set is_verified to false
      console.log('[Admin Verify] Revoking verification for developer:', developerId);
      
      const { data, error } = await adminClient
        .from('developers')
        .update({ is_verified: false })
        .eq('id', developerId)
        .select();

      if (error) {
        console.error('[Admin Verify] Revoke error:', error);
        throw error;
      }

      console.log('[Admin Verify] Revoke successful:', data);

      return new Response(
        JSON.stringify({ success: true, message: 'Verification revoked' }),
        { status: 200 }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Admin verify error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    );
  }
};

