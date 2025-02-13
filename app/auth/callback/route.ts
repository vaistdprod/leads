import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const signupToken = requestUrl.searchParams.get('signup_token')

  if (code) {
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

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // If we have a signup token, this is a new registration
    if (signupToken) {
      // Mark signup token as used
      const { error: tokenError } = await supabase
        .from('signup_tokens')
        .update({ 
          used: true, 
          used_by: session.user.id, 
          used_at: new Date().toISOString() 
        })
        .eq('token', signupToken)

      if (tokenError) {
        console.error('Failed to update signup token:', tokenError)
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{ 
          id: session.user.id, 
          setup_completed: false 
        }])

      if (profileError) {
        console.error('Failed to create user profile:', profileError)
      }

      // Redirect to next setup step
      return NextResponse.redirect(new URL('/setup/gemini-setup', request.url))
    }

    // For existing users, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If no code, redirect to login
  return NextResponse.redirect(new URL('/auth/login', request.url))
}