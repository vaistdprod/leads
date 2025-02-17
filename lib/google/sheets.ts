import { google } from 'googleapis';
import { getGoogleAuthClient } from './googleAuth';

export interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  scheduledFor?: string;
  status?: 'pending' | 'sent' | 'failed';
}

interface RawContact {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  scheduledFor: string | undefined;
  status: 'pending' | 'sent' | 'failed';
}

export async function getBlacklist(sheetId: string): Promise<string[]> {
  try {
    const auth = await getGoogleAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:A',
    });

    if (!data.values) {
      console.log('No data found in blacklist sheet');
      return [];
    }

    // Filter out empty values and convert to lowercase
    const emails = data.values
      .flat()
      .filter(email => email && typeof email === 'string')
      .map(email => email.toLowerCase().trim());

    console.log('Blacklist data:', { emails });
    return emails;
  } catch (error) {
    console.error('Failed to get blacklist:', error);
    throw error;
  }
}

export async function getContacts(sheetId: string): Promise<Contact[]> {
  try {
    const auth = await getGoogleAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:K',
    });

    if (!data.values || data.values.length < 2) {
      console.log('No data found in contacts sheet');
      return [];
    }

    const [headers, ...rows] = data.values;
    const normalizedHeaders = headers.map((header: string) => header.toLowerCase().trim());

    // Find required column indices
    const nameIndex = normalizedHeaders.indexOf('název');
    const emailIndex = normalizedHeaders.indexOf('email');
    const companyIndex = normalizedHeaders.findIndex(h => h === 'společnost');
    const positionIndex = normalizedHeaders.findIndex(h => h === 'pozice');
    const scheduledForIndex = normalizedHeaders.findIndex(h => h === 'scheduledfor');
    const statusIndex = normalizedHeaders.findIndex(h => h === 'status');

    if (nameIndex === -1 || emailIndex === -1) {
      throw new Error('Required columns not found in contacts sheet');
    }

    const contacts = rows
      .map(row => {
        if (!row[nameIndex] || !row[emailIndex]) return null;

        const nameParts = row[nameIndex].trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const rawContact: RawContact = {
          firstName,
          lastName,
          email: row[emailIndex].trim(),
          company: row[companyIndex]?.trim() || 'Unknown Company',
          position: row[positionIndex]?.trim() || 'Unknown Position',
          scheduledFor: row[scheduledForIndex]?.trim(),
          status: (row[statusIndex]?.trim().toLowerCase() || 'pending') as 'pending' | 'sent' | 'failed'
        };

        return rawContact;
      })
      .filter((contact): contact is RawContact => contact !== null);

    console.log('Contacts data:', { contacts });
    return contacts;
  } catch (error) {
    console.error('Failed to get contacts:', error);
    throw error;
  }
}

export async function updateContact(sheetId: string, email: string, updates: { scheduledFor?: string; status?: string }) {
  try {
    const auth = await getGoogleAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // First get the sheet data to find the row
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:K',
    });

    if (!data.values || data.values.length < 2) {
      console.warn('No data found in sheet');
      return;
    }

    const [headers, ...rows] = data.values;
    const normalizedHeaders = headers.map((header: string) => header.toLowerCase().trim());

    const emailIndex = normalizedHeaders.indexOf('email');
    const scheduledForIndex = normalizedHeaders.indexOf('scheduledfor');
    const statusIndex = normalizedHeaders.indexOf('status');

    if (emailIndex === -1) {
      console.warn('Email column not found');
      return;
    }

    // Find the row with matching email
    const rowIndex = rows.findIndex(row => 
      row[emailIndex]?.toLowerCase().trim() === email.toLowerCase().trim()
    );

    if (rowIndex === -1) {
      console.warn('Contact not found:', email);
      return;
    }

    // Prepare batch update requests
    const requests = [];

    if (updates.scheduledFor && scheduledForIndex !== -1) {
      requests.push({
        range: `${String.fromCharCode(65 + scheduledForIndex)}${rowIndex + 2}`,
        values: [[updates.scheduledFor]]
      });
    }

    if (updates.status && statusIndex !== -1) {
      requests.push({
        range: `${String.fromCharCode(65 + statusIndex)}${rowIndex + 2}`,
        values: [[updates.status]]
      });
    }

    // Execute batch update
    if (requests.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: requests
        }
      });
      console.log('Updated contact:', email, updates);
    }
  } catch (error) {
    console.error('Failed to update contact:', error);
    throw error;
  }
}
