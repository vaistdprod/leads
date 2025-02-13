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
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (!code) {
      console.error('No code received')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const cookieStore = cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Get current session after exchange
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(new URL('/auth/login', request.url))
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
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      return NextResponse.redirect(new URL('/setup/welcome', request.url))
    }

    // Redirect based on setup status
    const redirectUrl = profile?.setup_completed ? '/dashboard' : '/setup/welcome'
    let finalRedirectUrl = redirectUrl;

    if (requestUrl.searchParams.get('state') === 'source=google_setup' && profile && !profile.setup_completed) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ setup_completed: true })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      finalRedirectUrl = '/dashboard';
    }

    return NextResponse.redirect(new URL(finalRedirectUrl, request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}
