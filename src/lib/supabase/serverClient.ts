import { createServerClient } from '@supabase/ssr';
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
        return cookies.get(name)?.value;
      },
      set(name: string, value: string, options?: any) {
        cookies.set(name, value, options);
      },
      remove(name: string, options?: any) {
        cookies.delete(name, options);
      },
    },
  });
  return client as unknown as SupabaseClient;
}


