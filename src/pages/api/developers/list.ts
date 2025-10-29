import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { getVerifiedDevelopers } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const supabase = createSupabaseServerClient(cookies as any);
    
    // Get verified developers from Supabase
    const developers = await getVerifiedDevelopers(supabase);

    // Map to frontend format
    const formattedDevelopers = developers.map(dev => ({
      name: dev.name,
      username: dev.username,
      avatar: dev.avatar || '',
      bio: dev.bio || '',
      github: dev.github || '',
      linkedin: dev.linkedin || '',
      telegram: dev.telegram || '',
      entry: dev.entry || '',
      projects: dev.projects || [],
      certificates: dev.certificates || [],
      website: dev.website || '',
      slushWallet: dev.slush_wallet || '',
      walrusBlobId: dev.walrus_blob_id || null,
    }));

    return new Response(
      JSON.stringify(formattedDevelopers),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error: any) {
    console.error('Error fetching developers:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    );
  }
};

