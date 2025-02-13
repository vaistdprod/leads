import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error, requestUrl.searchParams.toString());
      const loginRedirectUrl = new URL('/auth/login', request.url);
      console.log('Redirecting to:', loginRedirectUrl.toString());
      return NextResponse.redirect(loginRedirectUrl)
    }

    if (!code) {
      console.error('No code received')
      const loginRedirectUrl = new URL('/auth/login', request.url);
      console.log('Redirecting to:', loginRedirectUrl.toString());
      return NextResponse.redirect(loginRedirectUrl)
    }

    const cookieStore = cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      const loginRedirectUrl = new URL('/auth/login', request.url);
      console.log('Redirecting to:', loginRedirectUrl.toString());
      return NextResponse.redirect(loginRedirectUrl)
    }

    // Get current session after exchange
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('Session error:', sessionError)
      const loginRedirectUrl = new URL('/auth/login', request.url);
      console.log('Redirecting to:', loginRedirectUrl.toString());
      return NextResponse.redirect(loginRedirectUrl)
    }

    // Create settings record if it doesn't exist
    const { data: existingSettings } = await supabase
      .from('settings')
      .select('id')
      .single()

    if (!existingSettings) {
      const { error: settingsError } = await supabase
        .from('settings')
        .insert([{
          user_id: session.user.id,
        }])

      if (settingsError) {
        console.error('Settings creation error:', settingsError)
      }
    }

    // Create user profile if it doesn't exist
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') { // Not found error
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert([{ 
          id: session.user.id,
          setup_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (insertError) {
        console.error('Profile creation error:', insertError)
        const loginRedirectUrl = new URL('/auth/login', request.url);
        console.log('Redirecting to:', loginRedirectUrl.toString());
        return NextResponse.redirect(loginRedirectUrl)
      }

      const redirectUrl = new URL('/setup/welcome', request.url);
      console.log('Redirecting to:', redirectUrl.toString());
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect based on setup status
    const redirectUrl = profile?.setup_completed ? '/dashboard' : '/setup/welcome'

    if (requestUrl.searchParams.get('state') === 'source=google_setup' && profile && !profile.setup_completed) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ setup_completed: true })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      const dashboardRedirectUrl = new URL('/dashboard', request.url);
      console.log('Redirecting to:', dashboardRedirectUrl.toString());
      return NextResponse.redirect(dashboardRedirectUrl)

    }

    const finalRedirectUrl = new URL(redirectUrl, request.url);
    console.log('Redirecting to:', finalRedirectUrl.toString());
    return NextResponse.redirect(finalRedirectUrl);

  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}
