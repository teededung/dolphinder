import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { getCurrentUser, isAdmin } from '../../../lib/auth';

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

    // Check if user is admin
    if (!isAdmin(user.email)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { developerId, action } = body;

    if (!developerId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing developerId or action' }),
        { status: 400 }
      );
    }

    // Handle different actions
    if (action === 'approve') {
      // Set is_verified to true
      const { error } = await supabase
        .from('developers')
        .update({ is_verified: true })
        .eq('id', developerId);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Developer approved' }),
        { status: 200 }
      );

    } else if (action === 'reject') {
      // Delete the developer record
      const { error } = await supabase
        .from('developers')
        .delete()
        .eq('id', developerId);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Developer rejected' }),
        { status: 200 }
      );

    } else if (action === 'revoke') {
      // Set is_verified to false
      const { error } = await supabase
        .from('developers')
        .update({ is_verified: false })
        .eq('id', developerId);

      if (error) {
        throw error;
      }

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

