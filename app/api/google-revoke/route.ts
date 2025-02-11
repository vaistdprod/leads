import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isDevelopment } from '@/lib/supabase/client';

export async function POST() {
  try {
    if (isDevelopment) {
      return NextResponse.json({ success: true });
    }

    const cookieStore = cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const { error } = await supabase
      .from('settings')
      .update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expiry: null,
        updated_at: new Date().toISOString(),
      })
      .single();

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to revoke Google access:', error);
    return NextResponse.json({ error: 'Failed to revoke Google access' }, { status: 500 });
  }
}
