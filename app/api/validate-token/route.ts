import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isDevelopment } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const email = url.searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Missing token or email' },
        { status: 400 }
      );
    }

    if (isDevelopment) {
      return NextResponse.json({ 
        valid: true, 
        data: {
          token,
          email,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    }

    const cookieStore = cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const { data, error } = await supabase
      .from('signup_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', decodeURIComponent(email))
      .eq('used', false)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { 
          error: 'Token not found or invalid',
          details: 'No matching unused token found for the provided email'
        },
        { status: 404 }
      );
    }

    // Check expiration
    const expiryDate = new Date(data.expires_at);
    const now = new Date();
    
    if (expiryDate < now) {
      return NextResponse.json(
        { 
          error: 'Token has expired',
          details: {
            expiryDate: data.expires_at,
            currentDate: now.toISOString()
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      valid: true, 
      data,
      headers: {
        'Cache-Control': 'no-store',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to validate token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}