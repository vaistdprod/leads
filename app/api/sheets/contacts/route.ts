import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isDevelopment } from '@/lib/env';
import { getGoogleAuthClient } from '@/lib/google/googleAuth';
import { google } from 'googleapis';

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

interface SheetContact {
  název?: string;
  email?: string;
  adresa?: string;
  [key: string]: string | undefined;
}

interface ProcessedContact {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
}

function processContact(rawContact: SheetContact): ProcessedContact | null {
  if (!rawContact.email || !rawContact.název) {
    return null;
  }

  // Split the "název" field into first and last name
  const nameParts = rawContact.název.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    firstName,
    lastName,
    email: rawContact.email.trim(),
    company: rawContact.společnost?.trim() || 'Unknown Company',
    position: rawContact.pozice?.trim() || 'Unknown Position',
  };
}

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
    
    // Use the sheets API directly instead of fetch
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('Fetching contacts from Google Sheets...');
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:I',
    });

    if (!data.values || data.values.length < 2) {
      console.log('No data found in sheet');
      return NextResponse.json({ contacts: [] });
    }

    const [headers, ...rows] = data.values;
    
    // Convert headers to lowercase and normalize
    const normalizedHeaders = headers.map((header: string) => header.toLowerCase().trim());

    // Map rows to contacts with proper structure
    const contacts = rows
      .map((row: any[]) => {
        const rawContact: SheetContact = {};
        normalizedHeaders.forEach((header: string, index: number) => {
          if (row[index]) {
            rawContact[header] = row[index];
          }
        });
        return processContact(rawContact);
      })
      .filter((contact): contact is ProcessedContact => contact !== null);

    console.log(`Processed ${contacts.length} contacts`);
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Failed to get contacts:', error);
    return NextResponse.json({ 
      error: 'Failed to get contacts',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}