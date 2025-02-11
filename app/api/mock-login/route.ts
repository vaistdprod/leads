import { NextResponse } from 'next/server';
import { createMockSession } from '@/lib/supabase/client';
import { cookies } from 'next/headers';

export async function POST() {
  const mockSession = createMockSession();
  const sessionString = JSON.stringify(mockSession);

  // Await cookies() call
  const cookieStore = await cookies();
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
  // Await cookies() call
  const cookieStore = await cookies();
  const storedSession = await cookieStore.get('sb-mock-session');

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
