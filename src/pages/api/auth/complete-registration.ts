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

    // Extract GitHub metadata
    const metadata = user.user_metadata;
    const username = metadata.user_name || metadata.preferred_username || user.email?.split('@')[0] || 'user';
    const name = metadata.full_name || metadata.name || username;
    const githubAvatarUrl = metadata.avatar_url;
    const githubProfile = metadata.user_name ? `https://github.com/${metadata.user_name}` : null;

    console.log('[complete-registration] Checking for existing profile to claim...');

    // Try to find existing profile to claim (user_id=NULL)
    let existingProfile = null;

    // 1. Check by GitHub URL (most reliable)
    if (githubProfile) {
      const { data } = await supabase
        .from('developers')
        .select('*')
        .eq('github', githubProfile)
        .is('user_id', null)
        .single();
      
      if (data) {
        console.log('[complete-registration] Found existing profile by GitHub URL:', data.username);
        existingProfile = data;
      }
    }

    // 2. If no match, check by username
    if (!existingProfile) {
      const { data } = await supabase
        .from('developers')
        .select('*')
        .eq('username', username)
        .is('user_id', null)
        .single();
      
      if (data) {
        console.log('[complete-registration] Found existing profile by username:', data.username);
        existingProfile = data;
      }
    }

    // If existing profile found, claim it by updating user_id
    if (existingProfile) {
      console.log('[complete-registration] Claiming existing profile:', existingProfile.username);
      
      const { error: updateError } = await supabase
        .from('developers')
        .update({
          user_id: user.id,
          // Only fill missing fields from GitHub OAuth
          avatar: existingProfile.avatar || githubAvatarUrl,
          github: existingProfile.github || githubProfile,
          // Keep all existing data (name, bio, linkedin, telegram, slush_wallet, entry)
        })
        .eq('id', existingProfile.id);

      if (updateError) {
        console.error('[complete-registration] Failed to claim profile:', updateError);
        throw updateError;
      }

      console.log('[complete-registration] Profile claimed successfully (is_verified remains true)');
      return redirect('/dashboard?welcome=true');
    }

    // No existing profile found, create new one
    console.log('[complete-registration] Creating new profile for:', username);

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

