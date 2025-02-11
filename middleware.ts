import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    if (!session) {
      // Redirect to login if no session
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Check if setup is completed
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('setup_completed')
      .eq('id', session.user.id)
      .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        // Handle the error appropriately, maybe redirect to an error page
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

    if (!profile?.setup_completed) {
      // Redirect to setup if not completed
      return NextResponse.redirect(new URL('/setup/welcome', request.url));
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
