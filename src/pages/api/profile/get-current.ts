import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { getCurrentUser, getDeveloperProfile } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
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

    return new Response(
      JSON.stringify({ 
        success: true,
        developer,
      }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Get current profile error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    );
  }
};
