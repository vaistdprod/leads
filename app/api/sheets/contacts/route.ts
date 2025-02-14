/* /app/api/sheets/contacts/route.ts */
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
return NextResponse.json({ contacts: mockContacts });
}

const { searchParams } = new URL(request.url);
const sheetId = searchParams.get('sheetId');
if (!sheetId) {
  return NextResponse.json({ error: 'Sheet ID is required' }, { status: 400 });
}

// Option 1: Retrieve impersonatedEmail from the query */}
// Option 2: Determine the impersonated user from your session/auth logic
// Here, we check for a query parameter 'impersonatedEmail'
const impersonatedEmail = searchParams.get('impersonatedEmail') || process.env.GOOGLE_DELEGATED_USER;

const auth = await getGoogleAuthClient(impersonatedEmail);
const tokenResponse = await auth.getAccessToken();
const accessToken = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;
if (!accessToken) {
  return NextResponse.json({ error: 'Failed to authenticate with Google' }, { status: 401 });
}

const response = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:I`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
if (!response.ok) {
  throw new Error('Failed to fetch from Google Sheets');
}

const data = await response.json();
const [headers, ...rows] = data.values || [];
const contacts = rows.map((row: any[]) => {
  const contact: Record<string, string> = {};
  headers.forEach((header: string, index: number) => {
    contact[header.toLowerCase()] = row[index] || '';
  });
  return contact;
});

return NextResponse.json({ contacts });
} catch (error) {
console.error('Failed to get contacts:', error);
return NextResponse.json({ error: 'Failed to get contacts' }, { status: 500 });
}
}