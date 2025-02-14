import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isDevelopment } from '@/lib/env';
import { getGoogleAuthClient } from '@/lib/google/googleAuth';

export const dynamic = 'force-dynamic';

// Mock data for development
const mockContacts = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    company: 'Acme Inc',
    position: 'CEO',
    phone: '+1234567890'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    company: 'Tech Corp',
    position: 'CTO',
    phone: '+0987654321'
  }
];

export async function GET(request: Request) {
  try {
    if (isDevelopment) {
      console.log('Using mock contacts data');
      return NextResponse.json({ contacts: mockContacts });
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

    console.log('Fetching contacts from Google Sheets...');
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:I`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Sheets API error:', error);
      throw new Error(`Failed to fetch from Google Sheets: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Raw sheet data:', data);

    if (!data.values || data.values.length < 2) {
      return NextResponse.json({ contacts: [] });
    }

    const [headers, ...rows] = data.values;
    const contacts = rows.map((row: any[]) => {
      const contact: Record<string, string> = {};
      headers.forEach((header: string, index: number) => {
        contact[header.toLowerCase()] = row[index] || '';
      });
      return contact;
    });

    console.log('Processed contacts:', contacts);
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Failed to get contacts:', error);
    return NextResponse.json({ 
      error: 'Failed to get contacts',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}