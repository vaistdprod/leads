import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isDevelopment } from '@/lib/env';
import { getGoogleAuthClient } from '@/lib/google/googleAuth';
import { google } from 'googleapis';

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
    
    // Use the sheets API directly
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('Fetching blacklist from Google Sheets...');
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'B:B',
    });

    if (!data.values) {
      console.log('No data found in sheet');
      return NextResponse.json({ emails: [] });
    }

    const emails = data.values
      .flat()
      .filter((email: any): email is string => typeof email === 'string')
      .map((email: string) => email.toLowerCase().trim());

    console.log(`Processed ${emails.length} blacklisted emails`);
    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Failed to get blacklist:', error);
    return NextResponse.json({ 
      error: 'Failed to get blacklist',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}