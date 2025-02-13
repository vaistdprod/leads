import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const state = requestUrl.searchParams.get('state')

    if (!code) {
      console.error('No code received from Google')
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
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.error('No session found')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Store Google OAuth code
    const { error: settingsError } = await supabase
      .from('settings')
      .upsert({
        user_id: session.user.id,
        google_auth_code: code,
        updated_at: new Date().toISOString()
      })

    if (settingsError) {
      console.error('Failed to store Google auth code:', settingsError)
      return NextResponse.redirect(new URL('/setup/google-auth', request.url))
    }

    // Check if user has completed setup
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('setup_completed')
      .eq('id', session.user.id)
      .single()

    if (!profile?.setup_completed) {
      return NextResponse.redirect(new URL('/setup/gemini-setup', request.url))
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}