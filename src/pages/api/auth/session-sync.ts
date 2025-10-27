import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';

export const prerender = false;

/**
 * This endpoint helps sync client-side session to server-side cookies
 * after OAuth login completes
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token) {
      console.error('[session-sync] Missing access token');
      return new Response(
        JSON.stringify({ error: 'Missing access token' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[session-sync] Creating server client...');
    const supabase = createSupabaseServerClient(cookies as any);

    console.log('[session-sync] Setting session...');
    // Set session from tokens - this should set cookies automatically
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error('[session-sync] Error setting session:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[session-sync] Session set successfully for user:', data.user?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: data.user,
        session_set: true 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    console.error('[session-sync] Exception:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

