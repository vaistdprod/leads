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
    const { error: settingsError } = await supabase
      .from('settings')
      .upsert([{
        user_id: session.user.id,
        gemini_api_key: null,
        blacklist_sheet_id: null,
        contacts_sheet_id: null,
      }], { onConflict: 'user_id' });

    if (settingsError) {
      return redirectWithError(new URL('/auth/login', request.url), 'Settings error:', settingsError);
    }

    // After successful Google auth, go to dashboard
    const redirectUrl = '/dashboard';

    const finalRedirectUrl = new URL(redirectUrl, request.url);
    console.log('Redirecting to:', finalRedirectUrl.toString()); // Keep this log, it's not an error
    return NextResponse.redirect(finalRedirectUrl);

  } catch (error) {
    return redirectWithError(new URL('/auth/login', request.url), 'Auth callback error:', error);
  }
}
