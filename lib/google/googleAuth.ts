import { google } from 'googleapis';
import { getEnvOrThrow } from '@/lib/env/validateEnv';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

export const getGoogleAuthClient = async (impersonatedUser?: string) => {
  try {
    // Get required environment variables
    const serviceAccountEmail = getEnvOrThrow('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKey = getEnvOrThrow('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY').replace(/\\n/g, '\n');
    const defaultUser = getEnvOrThrow('GOOGLE_DELEGATED_USER');

    console.log('Creating JWT client with service account:', serviceAccountEmail);
    console.log('Impersonating user:', impersonatedUser || defaultUser);

    const client = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: SCOPES,
      subject: impersonatedUser || defaultUser,
    });

    console.log('Authorizing client...');
    await client.authorize();
    console.log('Client authorized successfully');

    return client;
  } catch (error) {
    console.error('Failed to create Google auth client:', error);
    throw new Error(`Google auth failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};