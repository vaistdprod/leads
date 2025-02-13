import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) {
    return NextResponse.redirect('/settings/google');
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/settings/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to exchange token');
    }

    const { access_token, refresh_token, expires_in, id_token } = data;

    // Store tokens in user metadata
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      const { error } = await supabase.auth.updateUser({
        data: {
          google_access_token: access_token,
          google_refresh_token: refresh_token,
          google_expires_in: expires_in,
          google_id_token: id_token,
        },
      });
      if (error) {
        console.error('Error updating user with Google tokens:', error);
      }
    }

    // Redirect to settings page
    return NextResponse.redirect('/settings/google');
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect('/settings/google');
  }
}
