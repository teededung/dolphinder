import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { getCurrentUser, getDeveloperProfile } from '../../../lib/auth';
import type { Project } from '../../../types/project';

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
    const { projects } = body;

    // Validate projects array
    if (!Array.isArray(projects)) {
      return new Response(
        JSON.stringify({ error: 'Projects must be an array' }),
        { status: 400 }
      );
    }

    // Validate each project
    for (const project of projects) {
      if (!project.id || !project.name || !project.description) {
        return new Response(
          JSON.stringify({ 
            error: 'Each project must have id, name, and description' 
          }),
          { status: 400 }
        );
      }

      if (!['active', 'completed', 'in-progress'].includes(project.status)) {
        return new Response(
          JSON.stringify({ 
            error: 'Project status must be one of: active, completed, in-progress' 
          }),
          { status: 400 }
        );
      }

      if (!Array.isArray(project.tags)) {
        return new Response(
          JSON.stringify({ error: 'Project tags must be an array' }),
          { status: 400 }
        );
      }

      if (typeof project.featured !== 'boolean') {
        return new Response(
          JSON.stringify({ error: 'Project featured must be a boolean' }),
          { status: 400 }
        );
      }
    }

    // Update projects in database
    const { data, error: updateError } = await supabase
      .from('developers')
      .update({ projects })
      .eq('id', developer.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Projects updated successfully',
        developer: data,
      }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Projects update error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    );
  }
};

