import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const supabase = createSupabaseServerClient(cookies as any);
    
    // Simple health check: just verify client was created successfully
    // and can call getSession without throwing
    const { error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: sessionError.message,
          message: 'Supabase client created but auth.getSession failed'
        }),
        { status: 500 }
      );
    }
    
    // If we got here, connection is working
    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: 'Supabase connection successful',
        supabaseUrl: (import.meta as any).env.PUBLIC_SUPABASE_URL
      }),
      { status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || String(err) }),
      { status: 500 }
    );
  }
};


