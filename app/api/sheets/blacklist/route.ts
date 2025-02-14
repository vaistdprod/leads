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
return NextResponse.json({ emails: mockBlacklist });
}

const { searchParams } = new URL(request.url);
const sheetId = searchParams.get('sheetId');
if (!sheetId) {
  return NextResponse.json({ error: 'Sheet ID is required' }, { status: 400 });
}

// Get an authorized client and retrieve its access token
const auth = await getGoogleAuthClient();
const tokenResponse = await auth.getAccessToken();
const accessToken = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;
if (!accessToken) {
  throw new Error('Unable to retrieve access token');
}

const response = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/B:B`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
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