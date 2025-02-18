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

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

async function retryOperation<T>(operation: () => Promise<T>, attempts: number = RETRY_ATTEMPTS): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (attempts <= 1 || !isRetryableError(error)) {
      throw error;
    }
    
    console.log(`Retrying operation, ${attempts - 1} attempts remaining...`);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return retryOperation(operation, attempts - 1);
  }
}

function isRetryableError(error: any): boolean {
  // Google Sheets API specific error codes that warrant a retry
  const retryableErrors = [
    403, // Forbidden (might be temporary due to token expiration)
    429, // Too Many Requests
    500, // Internal Server Error
    503, // Service Unavailable
    'ECONNRESET',
    'ETIMEDOUT'
  ];

  return retryableErrors.some(code => 
    error.code === code || 
    error.message?.includes(String(code)) ||
    error.status === code
  );
}

async function validateSheetStructure(sheets: any, sheetId: string, requiredColumns: string[]) {
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: '1:1', // First row only
  });

  if (!data.values || data.values.length === 0) {
    throw new Error('Sheet is empty');
  }

  const headers = data.values[0].map((header: string) => header.toLowerCase().trim());
  const missingColumns = requiredColumns.filter(col => !headers.includes(col.toLowerCase()));

  if (missingColumns.length > 0) {
    throw new Error(`Required columns missing: ${missingColumns.join(', ')}`);
  }

  return headers;
}

export async function getBlacklist(sheetId: string): Promise<string[]> {
  return retryOperation(async () => {
    try {
      const auth = await getGoogleAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      await validateSheetStructure(sheets, sheetId, ['email']);

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
  });
}

export async function getContacts(sheetId: string, columnMappings: Record<string, string>): Promise<Contact[]> {
  return retryOperation(async () => {
    try {
      const auth = await getGoogleAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      // Use column mappings from settings
      const requiredColumns = Object.values(columnMappings);
      const headers = await validateSheetStructure(sheets, sheetId, requiredColumns);

      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A:K',
      });

      if (!data.values || data.values.length < 2) {
        console.log('No data found in contacts sheet');
        return [];
      }

      const [, ...rows] = data.values;

      // Find required column indices using mappings
      const nameIndex = headers.indexOf(columnMappings.name);
      const emailIndex = headers.indexOf(columnMappings.email);
      const companyIndex = headers.findIndex((h: string) => h === columnMappings.company);
      const positionIndex = headers.findIndex((h: string) => h === columnMappings.position);
      const scheduledForIndex = headers.findIndex((h: string) => h === columnMappings.scheduledFor);
      const statusIndex = headers.findIndex((h: string) => h === columnMappings.status);

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
  });
}

interface BatchUpdate {
  email: string;
  updates: { scheduledFor?: string; status?: string };
}

export async function updateContacts(sheetId: string, updates: BatchUpdate[]) {
  return retryOperation(async () => {
    try {
      const auth = await getGoogleAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      // First get the sheet data to find the rows
      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A:K',
      });

      if (!data.values || data.values.length < 2) {
        console.warn('No data found in sheet');
        return;
      }

      const headers = data.values?.[0];
      if (!headers) {
        throw new Error('No headers found in sheet');
      }
      const normalizedHeaders = headers.map((header: string) => header.toLowerCase().trim());

      const emailIndex = normalizedHeaders.indexOf('email');
      const scheduledForIndex = normalizedHeaders.indexOf('scheduledfor');
      const statusIndex = normalizedHeaders.indexOf('status');

      if (emailIndex === -1) {
        console.warn('Email column not found');
        return;
      }

      const batchRequests = updates.flatMap(update => {
        const rowIndex = (data.values as string[][]).findIndex((row, index) => 
          index > 0 && // Skip header row
          row[emailIndex]?.toLowerCase().trim() === update.email.toLowerCase().trim()
        );

        if (rowIndex === -1) {
          console.warn('Contact not found:', update.email);
          return [];
        }

        const requests = [];

        if (update.updates.scheduledFor && scheduledForIndex !== -1) {
          requests.push({
            range: `${String.fromCharCode(65 + scheduledForIndex)}${rowIndex + 1}`,
            values: [[update.updates.scheduledFor]]
          });
        }

        if (update.updates.status && statusIndex !== -1) {
          requests.push({
            range: `${String.fromCharCode(65 + statusIndex)}${rowIndex + 1}`,
            values: [[update.updates.status]]
          });
        }

        return requests;
      });

      // Execute batch update
      if (batchRequests.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            valueInputOption: 'RAW',
            data: batchRequests
          }
        });
        console.log('Updated contacts:', updates);
      }
    } catch (error) {
      console.error('Failed to update contacts:', error);
      throw error;
    }
  });
}

// Maintain backward compatibility
export async function updateContact(sheetId: string, email: string, updates: { scheduledFor?: string; status?: string }) {
  return updateContacts(sheetId, [{ email, updates }]);
}
