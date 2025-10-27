import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { isAdmin } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.json();
    const { email, password } = formData;

    const supabase = createSupabaseServerClient(cookies as any);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user is admin and return appropriate redirect
    const redirectTo = isAdmin(data.user.email || '') 
      ? '/admin/dashboard' 
      : '/dashboard';

    // Session is now saved in cookies automatically via serverClient
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: data.user,
        redirectTo 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

