import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isDevelopment } from '@/lib/env'

export async function middleware(request: NextRequest) {
  // Skip middleware for static files and API routes
  if (
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg)$/i) ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Skip auth check in development mode
    if (isDevelopment) {
      const devAuth = request.cookies.get('dev_auth')?.value;
      if (!devAuth && !request.nextUrl.pathname.startsWith('/auth/')) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      return response;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.delete({
              name,
              ...options,
            });
          },
        },
      }
    );

    // Check if this is a registration request with a token
    if (request.nextUrl.pathname === '/auth/register') {
      const signupToken = request.nextUrl.searchParams.get('signup_token');
      const email = request.nextUrl.searchParams.get('email');

      if (signupToken && email) {
        return response;
      }

      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Allow access to login page
    if (request.nextUrl.pathname === '/auth/login') {
      return response;
    }

    // For all other routes, check session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Only check setup completion for dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('setup_completed')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      if (!profile?.setup_completed) {
        return NextResponse.redirect(new URL('/setup/welcome', request.url));
      }
    }

    return response;
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};