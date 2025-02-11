import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getEnv, isDevelopment } from './lib/env'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip authentication for static files, API routes, and auth pages
  if (
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg)$/i) ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/auth/')
  ) {
    return response
  }

  try {
    // Get environment variables
    const env = getEnv();

    // Create Supabase client
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.delete({
              name,
              ...options,
            })
          },
        },
      }
    )

    // Check session
    const { data: { session } } = await supabase.auth.getSession()

    // Allow access in development mode
    if (isDevelopment) {
      const devAuth = request.cookies.get('dev_auth')?.value === 'true';
      const devToken = request.cookies.get('sb-dev-auth-token')?.value;
      
      if (devAuth && devToken) {
        return response;
      }
    }

    // Redirect to login if no session
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    return response
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}