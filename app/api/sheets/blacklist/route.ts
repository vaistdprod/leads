import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isDevelopment } from '@/lib/env';
import { getGoogleAuthClient } from '@/lib/google/googleAuth';

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
      console.log('Using mock blacklist data');
      return NextResponse.json({ emails: mockBlacklist });
    }

    const { searchParams } = new URL(request.url);
    const sheetId = searchParams.get('sheetId');
    if (!sheetId) {
      return NextResponse.json({ error: 'Sheet ID is required' }, { status: 400 });
    }

    console.log('Getting Google auth client...');
    const auth = await getGoogleAuthClient();
    const tokenResponse = await auth.getAccessToken();
    const accessToken = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;
    if (!accessToken) {
      throw new Error('Unable to retrieve access token');
    }

    console.log('Fetching blacklist from Google Sheets...');
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/B:B`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Sheets API error:', error);
      throw new Error(`Failed to fetch from Google Sheets: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Raw sheet data:', data);

    const emails = (data.values || [])
      .flat()
      .filter((email: any): email is string => typeof email === 'string')
      .map((email: string) => email.toLowerCase().trim());

    console.log('Processed emails:', emails);
    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Failed to get blacklist:', error);
    return NextResponse.json({ 
      error: 'Failed to get blacklist',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}