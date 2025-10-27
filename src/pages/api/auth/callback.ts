import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase/serverClient';
import { getDeveloperProfile } from '../../../lib/auth';
import { downloadAvatar, isExternalUrl } from '../../../lib/avatar';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    console.error('OAuth error:', error);
    return redirect(`/register?error=${error}`);
  }

  if (!code) {
    console.log('[OAuth callback] No code parameter, redirecting to client-side handler');
    // No code means implicit flow - redirect to client-side handler
    return redirect('/auth/callback');
  }

  try {
    const supabase = createSupabaseServerClient(cookies as any);

    // Exchange code for session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return redirect('/register?error=session_failed');
    }

    const user = session.user;

    // Check if developer profile already exists
    const existingProfile = await getDeveloperProfile(supabase, user.id);

    if (existingProfile) {
      // User already has a profile, redirect to dashboard
      return redirect('/dashboard');
    }

    // Create new developer profile from GitHub data
    const metadata = user.user_metadata;
    const username = metadata.user_name || metadata.preferred_username || user.email?.split('@')[0] || 'user';
    const name = metadata.full_name || metadata.name || username;
    const githubAvatarUrl = metadata.avatar_url;
    const githubProfile = metadata.user_name ? `https://github.com/${metadata.user_name}` : null;

    // Download GitHub avatar
    let avatarPath = null;
    if (githubAvatarUrl && isExternalUrl(githubAvatarUrl)) {
      try {
        avatarPath = await downloadAvatar(githubAvatarUrl, username);
      } catch (error) {
        console.error('Failed to download avatar:', error);
        // Continue without avatar
      }
    }

    // Insert developer profile
    const { error: insertError } = await supabase
      .from('developers')
      .insert({
        user_id: user.id,
        username: username,
        name: name,
        avatar: avatarPath,
        github: githubProfile,
        bio: null,
        linkedin: null,
        telegram: null,
        slush_wallet: null,
        entry: null,
        is_verified: false, // New registrations need admin approval
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      
      // If username already exists, try with a unique suffix
      if (insertError.code === '23505') {
        const uniqueUsername = `${username}-${Date.now().toString(36).slice(-4)}`;
        
        const { error: retryError } = await supabase
          .from('developers')
          .insert({
            user_id: user.id,
            username: uniqueUsername,
            name: name,
            avatar: avatarPath,
            github: githubProfile,
            bio: null,
            linkedin: null,
            telegram: null,
            slush_wallet: null,
            entry: null,
            is_verified: false,
          });

        if (retryError) {
          throw retryError;
        }
      } else {
        throw insertError;
      }
    }

    // Redirect to dashboard
    return redirect('/dashboard?welcome=true');

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return redirect('/register?error=callback_failed');
  }
};

