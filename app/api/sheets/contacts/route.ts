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
    phone: '+1234567890',
    scheduledFor: '2025-02-18T10:00:00Z',
    status: 'pending'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    company: 'Tech Corp',
    position: 'CTO',
    phone: '+0987654321',
    scheduledFor: '2025-02-18T10:30:00Z',
    status: 'pending'
  }
];

interface SheetContact {
  název?: string;
  email?: string;
  adresa?: string;
  scheduledFor?: string;
  status?: string;
  [key: string]: string | undefined;
}

interface ProcessedContact {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  scheduledFor?: string;
  status?: 'pending' | 'sent' | 'failed';
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
    scheduledFor: rawContact.scheduledFor?.trim(),
    status: (rawContact.status?.trim().toLowerCase() || 'pending') as 'pending' | 'sent' | 'failed'
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
      range: 'A:K', // Extended range to include scheduling columns
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

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sheetId = searchParams.get('sheetId');
    if (!sheetId) {
      return NextResponse.json({ error: 'Sheet ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { email, scheduledFor, status } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const auth = await getGoogleAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // First get the sheet data to find the row
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:K',
    });

    if (!data.values || data.values.length < 2) {
      return NextResponse.json({ error: 'No data found in sheet' }, { status: 404 });
    }

    const [headers, ...rows] = data.values;
    const emailColumnIndex = headers.findIndex((header: string) => 
      header.toLowerCase().trim() === 'email'
    );
    const scheduledForColumnIndex = headers.findIndex((header: string) => 
      header.toLowerCase().trim() === 'scheduledfor'
    );
    const statusColumnIndex = headers.findIndex((header: string) => 
      header.toLowerCase().trim() === 'status'
    );

    if (emailColumnIndex === -1) {
      return NextResponse.json({ error: 'Email column not found' }, { status: 400 });
    }

    // Find the row with matching email
    const rowIndex = rows.findIndex(row => 
      row[emailColumnIndex]?.toLowerCase().trim() === email.toLowerCase().trim()
    );

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Update the scheduling and status columns
    if (scheduledFor && scheduledForColumnIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${String.fromCharCode(65 + scheduledForColumnIndex)}${rowIndex + 2}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[scheduledFor]]
        }
      });
    }

    if (status && statusColumnIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${String.fromCharCode(65 + statusColumnIndex)}${rowIndex + 2}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[status]]
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update contact:', error);
    return NextResponse.json({ 
      error: 'Failed to update contact',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
