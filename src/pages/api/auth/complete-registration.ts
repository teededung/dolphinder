import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { getDeveloperProfile } from '../../../lib/auth';

export const prerender = false;

/**
 * Complete registration after OAuth
 * This ensures session is fully synced before redirecting
 */
export const GET: APIRoute = async ({ cookies, redirect }) => {
  try {
    console.log('[complete-registration] Starting...');
    const supabase = createSupabaseServerClient(cookies as any);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[complete-registration] No user found:', userError);
      return redirect('/register?error=no_session');
    }

    console.log('[complete-registration] User found:', user.id);

    // Check if profile exists
    const profile = await getDeveloperProfile(supabase, user.id);

    if (profile) {
      console.log('[complete-registration] Profile exists, redirecting to dashboard');
      return redirect('/dashboard');
    }

    // Create profile from user metadata
    const metadata = user.user_metadata;
    const username = metadata.user_name || metadata.preferred_username || user.email?.split('@')[0] || 'user';
    const name = metadata.full_name || metadata.name || username;
    const githubAvatarUrl = metadata.avatar_url;
    const githubProfile = metadata.user_name ? `https://github.com/${metadata.user_name}` : null;

    console.log('[complete-registration] Creating profile for:', username);

    // Create profile
    const { error: insertError } = await supabase
      .from('developers')
      .insert({
        user_id: user.id,
        username: username,
        name: name,
        avatar: githubAvatarUrl,
        github: githubProfile,
        bio: null,
        linkedin: null,
        telegram: null,
        slush_wallet: null,
        entry: null,
        is_verified: false,
      });

    if (insertError) {
      // Try with unique username if duplicate
      if (insertError.code === '23505') {
        const uniqueUsername = `${username}-${Date.now().toString(36).slice(-4)}`;
        console.log('[complete-registration] Username taken, trying:', uniqueUsername);
        
        const { error: retryError } = await supabase
          .from('developers')
          .insert({
            user_id: user.id,
            username: uniqueUsername,
            name: name,
            avatar: githubAvatarUrl,
            github: githubProfile,
            bio: null,
            linkedin: null,
            telegram: null,
            slush_wallet: null,
            entry: null,
            is_verified: false,
          });

        if (retryError) {
          console.error('[complete-registration] Retry failed:', retryError);
          throw retryError;
        }
      } else {
        console.error('[complete-registration] Insert error:', insertError);
        throw insertError;
      }
    }

    console.log('[complete-registration] Profile created successfully');

    // Redirect to dashboard with welcome message
    return redirect('/dashboard?welcome=true');

  } catch (error: any) {
    console.error('[complete-registration] Error:', error);
    return redirect('/register?error=registration_failed');
  }
};

