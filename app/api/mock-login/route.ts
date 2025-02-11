import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createMockSession } from '@/lib/supabase/client';
import { isDevelopment } from '@/lib/env';

export async function POST() {
  if (!isDevelopment) {
    return NextResponse.json({ error: 'Mock login only available in development mode' }, { status: 403 });
  }

  const mockSession = createMockSession();
  const sessionString = JSON.stringify(mockSession);

  const cookieStore = cookies();
  cookieStore.set('sb-mock-session', sessionString, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return NextResponse.json({ success: true }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function GET() {
  if (!isDevelopment) {
    return NextResponse.json({ success: false });
  }

  const cookieStore = cookies();
  const storedSession = cookieStore.get('sb-mock-session');

  if (!storedSession?.value) {
    return NextResponse.json({ success: false });
  }

  try {
    const mockSession = JSON.parse(storedSession.value);
    if (mockSession?.user?.id) {
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Error parsing mock session cookie:", error);
  }

  return NextResponse.json({ success: false });
}