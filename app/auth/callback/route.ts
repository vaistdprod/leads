import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

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
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code)

    // Get current session after exchange
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.error('No session after code exchange')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Check if user has completed setup
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('setup_completed')
      .eq('id', session.user.id)
      .single()

    // Create user profile if it doesn't exist
    if (!profile) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{ 
          id: session.user.id,
          setup_completed: false
        }])

      if (profileError) {
        console.error('Failed to create user profile:', profileError)
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      return NextResponse.redirect(new URL('/setup/welcome', request.url))
    }

    // Redirect based on setup status
    if (!profile.setup_completed) {
      return NextResponse.redirect(new URL('/setup/welcome', request.url))
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}