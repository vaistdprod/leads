import { google } from 'googleapis';
import { getGoogleAuthClient } from './googleAuth';
import { trackApiUsage } from '../api/tracking';

export interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  scheduledFor?: string;
  status: 'pending' | 'sent' | 'failed' | 'blacklist';
}

interface RawContact {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  scheduledFor: string | undefined;
  status: 'pending' | 'sent' | 'failed' | 'blacklist';
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
  const retryableErrors = [
    403,
    429,
    500,
    503,
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
    range: '1:1',
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
  const startTime = Date.now();
  let status = 200;

  return retryOperation(async () => {
    try {
      const auth = await getGoogleAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      await validateSheetStructure(sheets, sheetId, ['email']);
      const headers = await validateSheetStructure(sheets, sheetId, ['email']);
      const emailColumnLetter = String.fromCharCode(65 + headers.indexOf('email'));
      
      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${emailColumnLetter}:${emailColumnLetter}`,
      });

      const emails = (data.values || [])
        .slice(1)
        .flat()
        .filter(email => email && typeof email === 'string')
        .map(email => email.toLowerCase().trim())
        .filter(email => email !== 'email');

      await trackApiUsage('sheets', 'getBlacklist', status, Date.now() - startTime, {
        success: true,
        sheetId,
        emailCount: emails.length
      });

      return emails;
    } catch (error) {
      status = 500;
      console.error('Failed to get blacklist:', error);

      await trackApiUsage('sheets', 'getBlacklist', status, Date.now() - startTime, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sheetId
      });

      throw error;
    }
  });
}

export async function getContacts(sheetId: string, columnMappings: Record<string, string>): Promise<Contact[]> {
  const startTime = Date.now();
  let status = 200;

  return retryOperation(async () => {
    try {
      const auth = await getGoogleAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      const requiredColumns = Object.values(columnMappings);
      const headers = await validateSheetStructure(sheets, sheetId, requiredColumns);

      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A:K',
      });

      if (!data.values || data.values.length < 2) {
        await trackApiUsage('sheets', 'getContacts', status, Date.now() - startTime, {
          success: true,
          sheetId,
          contactCount: 0
        });
        return [];
      }

      const [, ...rows] = data.values;

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
            status: ((row[statusIndex]?.trim().toLowerCase() || 'pending') === 'blacklisted' ? 'blacklist' : (row[statusIndex]?.trim().toLowerCase() || 'pending')) as Contact['status']
          };

          return rawContact;
        })
        .filter((contact): contact is RawContact => contact !== null);

      await trackApiUsage('sheets', 'getContacts', status, Date.now() - startTime, {
        success: true,
        sheetId,
        contactCount: contacts.length
      });

      return contacts;
    } catch (error) {
      status = 500;
      console.error('Failed to get contacts:', error);

      await trackApiUsage('sheets', 'getContacts', status, Date.now() - startTime, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sheetId
      });

      throw error;
    }
  });
}

interface BatchUpdate {
  email: string;
  updates: { scheduledFor?: string; status?: string };
}

export async function updateContacts(sheetId: string, updates: BatchUpdate[]) {
  const startTime = Date.now();
  let status = 200;

  return retryOperation(async () => {
    try {
      const auth = await getGoogleAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A:K',
      });

      if (!data.values || data.values.length < 2) {
        await trackApiUsage('sheets', 'updateContacts', status, Date.now() - startTime, {
          success: true,
          sheetId,
          updatedCount: 0
        });
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
        throw new Error('Email column not found');
      }

      const batchRequests = updates.flatMap(update => {
        const rowIndex = (data.values as string[][]).findIndex((row, index) => 
          index > 0 && row[emailIndex]?.toLowerCase().trim() === update.email.toLowerCase().trim()
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

      if (batchRequests.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            valueInputOption: 'RAW',
            data: batchRequests
          }
        });
      }

      await trackApiUsage('sheets', 'updateContacts', status, Date.now() - startTime, {
        success: true,
        sheetId,
        updatedCount: batchRequests.length,
        updateTypes: updates.map(u => Object.keys(u.updates))
      });

    } catch (error) {
      status = 500;
      console.error('Failed to update contacts:', error);

      await trackApiUsage('sheets', 'updateContacts', status, Date.now() - startTime, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sheetId,
        updateCount: updates.length
      });

      throw error;
    }
  });
}

export async function updateContact(sheetId: string, email: string, updates: { scheduledFor?: string; status?: string }) {
  return updateContacts(sheetId, [{ email, updates }]);
}
