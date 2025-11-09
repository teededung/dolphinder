import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

type AstroCookies = {
  get: (name: string) => { value: string | undefined } | undefined;
  set: (name: string, value: string, options?: any) => void;
  delete: (name: string, options?: any) => void;
};

export function createSupabaseServerClient(cookies: AstroCookies): SupabaseClient {
  const supabaseUrl = (import.meta as any).env.PUBLIC_SUPABASE_URL as string | undefined;
  const supabaseAnonKey = (import.meta as any).env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY');
  }
  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const cookie = cookies.get(name);
        return cookie?.value;
      },
      set(name: string, value: string, options?: any) {
        try {
          // Ensure cookies are set with proper options for cross-domain OAuth
          cookies.set(name, value, {
            path: '/',
            sameSite: 'lax',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 days default
            ...options,
          });
        } catch (error) {
          console.error(`[Supabase] Failed to set cookie ${name}:`, error);
        }
      },
      remove(name: string, options?: any) {
        try {
          cookies.delete(name, {
            path: '/',
            ...options,
          });
        } catch (error) {
          console.error(`[Supabase] Failed to remove cookie ${name}:`, error);
        }
      },
    },
  });
  return client as unknown as SupabaseClient;
}

/**
 * Create a Supabase client with service role key for admin operations
 * This bypasses Row Level Security (RLS) policies
 * WARNING: Only use this for admin operations after proper authentication checks
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = (import.meta as any).env.PUBLIC_SUPABASE_URL as string | undefined;
  const supabaseServiceRoleKey = (import.meta as any).env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}


