import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Helper function for redirects
function redirectWithError(url: URL, message: string, error?: any) {
  console.error(message, error);
  console.log('Redirecting to:', url.toString());
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  if (error) {
    return redirectWithError(new URL('/auth/login', request.url), `OAuth error: ${error} ${requestUrl.searchParams.toString()}`);
  }

  if (!code) {
    return redirectWithError(new URL('/auth/login', request.url), 'No code received');
  }

  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  console.log('Cookies:', cookieStore);

  try {
    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return redirectWithError(new URL('/auth/login', request.url), 'Code exchange error:', exchangeError);
    }
  } catch (exchangeError) {
    return redirectWithError(new URL('/auth/login', request.url), 'Code exchange error:', exchangeError);
  }

  try {
    // Get current session after exchange
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return redirectWithError(new URL('/auth/login', request.url), 'Session error:', sessionError);
    }

    // Create settings record if it doesn't exist
    const { data: existingSettings, error: settingsSelectError } = await supabase
      .from('settings')
      .select('id')
      .single();

    if (settingsSelectError) {
      console.error('Settings select error:', settingsSelectError);
    }

    if (!existingSettings) {
      try {
        const { error: settingsError } = await supabase
          .from('settings')
          .insert([{
            user_id: session.user.id,
          }]);

        if (settingsError) {
          console.error('Settings creation error:', settingsError);
        }
      } catch (settingsError) {
        console.error('Settings creation error:', settingsError);
      }
    }

    // Get or create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // After successful Google OAuth, always mark setup as completed and redirect to dashboard
    if (profileError && profileError.code === 'PGRST116') { // Not found error
      try {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([{
            id: session.user.id,
            setup_completed: true, // Always mark as completed after Google auth
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (insertError) {
          return redirectWithError(new URL('/auth/login', request.url), 'Profile creation error:', insertError);
        }
      } catch (insertError) {
        return redirectWithError(new URL('/auth/login', request.url), 'Profile creation error:', insertError);
      }
    } else if (profile && !profile.setup_completed) {
      // If profile exists but setup not completed, mark it as completed
      try {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ setup_completed: true })
          .eq('id', session.user.id);

        if (updateError) {
          return redirectWithError(new URL('/auth/login', request.url), 'Profile update error:', updateError);
        }
      } catch (updateError) {
        return redirectWithError(new URL('/auth/login', request.url), 'Profile update error:', updateError);
      }
    }

    // Always redirect to dashboard after successful Google auth
    const redirectUrl = '/dashboard';

    const finalRedirectUrl = new URL(redirectUrl, request.url);
    console.log('Redirecting to:', finalRedirectUrl.toString()); // Keep this log, it's not an error
    return NextResponse.redirect(finalRedirectUrl);

  } catch (error) {
    return redirectWithError(new URL('/auth/login', request.url), 'Auth callback error:', error);
  }
}
