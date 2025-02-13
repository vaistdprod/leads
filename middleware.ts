import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip middleware for static files and API routes
  if (
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg)$/i) ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  try {
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
              domain: options.domain,
              maxAge: options.maxAge,
              path: options.path || '/',
              sameSite: 'lax',
              secure: true,
            });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              domain: options.domain,
              maxAge: 0,
              path: options.path || '/',
              sameSite: 'lax',
              secure: true,
            });
          },
        },
      }
    );

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const currentPath = request.nextUrl.pathname;

    // Handle session error
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Auth callback should bypass checks
    if (currentPath === '/auth/callback') {
      return response;
    }

    // Other auth routes
    if (currentPath.startsWith('/auth/')) {
      // Only redirect if user is already logged in and trying to access login page
      if (session && currentPath === '/auth/login') {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('setup_completed')
          .eq('id', session.user.id)
          .single();

        if (!profile?.setup_completed) {
          return NextResponse.redirect(new URL('/setup/welcome', request.url));
        }
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return response;
    }

    // Protected routes
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('setup_completed')
      .eq('id', session.user.id)
      .single();

    // Setup routes
    if (currentPath.startsWith('/setup/')) {
      if (profile?.setup_completed) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return response;
    }

    // Dashboard and other protected routes
    if (!profile?.setup_completed) {
      return NextResponse.redirect(new URL('/setup/welcome', request.url));
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
