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

    // Create or get settings record
    const { data: existingSettings, error: settingsSelectError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (settingsSelectError && settingsSelectError.code === 'PGRST116') { // Not found
      try {
        const { error: settingsError } = await supabase
          .from('settings')
          .insert([{
            user_id: session.user.id,
            gemini_api_key: null,
            blacklist_sheet_id: null,
            contacts_sheet_id: null,
          }]);

        if (settingsError) {
          return redirectWithError(new URL('/auth/login', request.url), 'Settings creation error:', settingsError);
        }
      } catch (settingsError) {
        return redirectWithError(new URL('/auth/login', request.url), 'Settings creation error:', settingsError);
      }
    } else if (settingsSelectError) {
      return redirectWithError(new URL('/auth/login', request.url), 'Settings error:', settingsSelectError);
    }

    // Create user profile if it doesn't exist
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') { // Not found error
      try {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([{
            id: session.user.id,
            setup_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (insertError) {
          return redirectWithError(new URL('/auth/login', request.url), 'Profile creation error:', insertError);
        }
      } catch (insertError) {
        return redirectWithError(new URL('/auth/login', request.url), 'Profile creation error:', insertError);
      }
    } else if (profileError) {
      return redirectWithError(new URL('/auth/login', request.url), 'Profile error:', profileError);
    }

    // After successful Google auth, always go to Gemini setup
    const redirectUrl = '/setup/gemini-setup';

    const finalRedirectUrl = new URL(redirectUrl, request.url);
    console.log('Redirecting to:', finalRedirectUrl.toString()); // Keep this log, it's not an error
    return NextResponse.redirect(finalRedirectUrl);

  } catch (error) {
    return redirectWithError(new URL('/auth/login', request.url), 'Auth callback error:', error);
  }
}
