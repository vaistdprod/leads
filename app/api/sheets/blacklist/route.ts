import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isDevelopment } from '@/lib/env'; // Corrected import

export const dynamic = 'force-dynamic';

// Mock data for development
const mockBlacklist = [
  'blacklisted1@example.com',
  'blacklisted2@example.com',
  'spam@example.com'
];

export async function GET(request: Request) {
  try {
    if (isDevelopment) {
      return NextResponse.json({ emails: mockBlacklist });
    }

    const { searchParams } = new URL(request.url);
    const sheetId = searchParams.get('sheetId');

    if (!sheetId) {
      return NextResponse.json({ error: 'Sheet ID is required' }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Google API key required' }, { status: 401 });
    }

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/B:B?key=${apiKey}`,
      {
        headers: {
          //Authorization: `Bearer ${settings.google_access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Google Sheets');
    }

    const data = await response.json();
    const emails = (data.values || [])
      .flat()
      .filter((email: any): email is string => typeof email === 'string')
      .map((email: string) => email.toLowerCase().trim());

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Failed to get blacklist:', error);
    return NextResponse.json({ error: 'Failed to get blacklist' }, { status: 500 });
  }
}
