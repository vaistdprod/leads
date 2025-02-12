import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Missing token or email' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const { data, error } = await supabase
      .from('signup_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .eq('used', false)
      .single();

    if (error) {
      console.error('Token validation error:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Check expiration
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true, data });
  } catch (error) {
    console.error('Token validation failed:', error);
    return NextResponse.json(
      { error: 'Failed to validate token' },
      { status: 500 }
    );
  }
}