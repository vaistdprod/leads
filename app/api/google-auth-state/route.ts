import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isDevelopment } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (isDevelopment) {
      return NextResponse.json({
        isAuthenticated: true,
        expiryDate: new Date(Date.now() + 3600000).toISOString(),
      });
    }

    const cookieStore = cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const { data: settings, error } = await supabase
      .from('settings')
      .select('google_access_token, google_refresh_token, google_token_expiry')
      .single();

    if (error) {
      console.error("Error fetching Google auth state:", error);
      return NextResponse.json({ isAuthenticated: false });
    }

    return NextResponse.json({
      isAuthenticated: !!settings?.google_access_token,
      expiryDate: settings?.google_token_expiry,
    });
  } catch (error) {
    console.error('Failed to get Google auth state:', error);
    return NextResponse.json({ error: 'Failed to get Google auth state' }, { status: 500 });
  }
}