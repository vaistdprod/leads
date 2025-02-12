import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isDevelopment } from '@/lib/env';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    console.log('Token validation request:', { token, email, decodedEmail: decodeURIComponent(email || '') });

    if (!token || !email) {
      console.error('Missing parameters:', { token, email });
      return NextResponse.json(
        { error: 'Missing token or email' },
        { status: 400 }
      );
    }

    if (isDevelopment) {
      console.log('Development mode - skipping validation');
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

    // First, let's check if the token exists at all
    const { data: allTokens, error: searchError } = await supabase
      .from('signup_tokens')
      .select('*')
      .eq('token', token);

    if (searchError) {
      console.error('Error searching for token:', searchError);
      return NextResponse.json(
        { error: 'Database error', details: searchError.message },
        { status: 500 }
      );
    }

    console.log('Found tokens:', allTokens);

    // Now let's check with all conditions
    const { data, error } = await supabase
      .from('signup_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', decodeURIComponent(email))
      .eq('used', false)
      .maybeSingle();

    if (error) {
      console.error('Token validation error:', error);
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 400 }
      );
    }

    if (!data) {
      console.error('Token not found or invalid:', { token, email });
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
    
    console.log('Token expiry check:', {
      expiryDate,
      now,
      isExpired: expiryDate < now
    });

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
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      },
      debug: {
        tokenFound: true,
        notExpired: true,
        notUsed: true,
        emailMatched: true,
        token: token,
        email: email,
        dataToken: data.token,
        dataEmail: data.email,
        dataExpiresAt: data.expires_at,
      }
    });
  } catch (error) {
    console.error('Token validation failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to validate token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}