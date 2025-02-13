import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (!code) {
      console.error('No code received')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: { path: string }) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: { path: string }) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

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

    // Check if user has completed setup
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('setup_completed')
      .eq('id', session.user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') { // Not found error
      console.error('Profile fetch error:', profileError)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Create user profile if it doesn't exist
    if (!profile) {
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert([{ 
          id: session.user.id,
          setup_completed: false
        }])

      if (insertError) {
        console.error('Profile creation error:', insertError)
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      return NextResponse.redirect(new URL('/setup/welcome', request.url))
    }

    // Redirect based on setup status
    return NextResponse.redirect(
      new URL(profile.setup_completed ? '/dashboard' : '/setup/welcome', request.url)
    )
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}