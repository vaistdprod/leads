import { google } from 'googleapis';
import { getEnvOrThrow } from '@/lib/env/validateEnv';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/admin.directory.user.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

export const getGoogleAuthClient = async (impersonatedUser?: string) => {
  try {
    // Get required environment variables
    const serviceAccountEmail = getEnvOrThrow('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKey = getEnvOrThrow('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')
      .replace(/\\n/g, '\n')
      .replace(/"$/, '')
      .replace(/^"/, '');
    const defaultUser = getEnvOrThrow('GOOGLE_DELEGATED_USER');

    // Create JWT client with subject (impersonation)
    const client = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: SCOPES,
      // Use impersonated user if provided, otherwise use default admin
      subject: impersonatedUser || defaultUser,
    });

    try {
      console.log('Authorizing client for:', impersonatedUser || defaultUser);
      await client.authorize();
      
      // Verify Gmail access
      const gmail = google.gmail({ version: 'v1', auth: client });
      await gmail.users.getProfile({ userId: 'me' });

      console.log('Authorization successful for:', impersonatedUser || defaultUser);
    } catch (authError) {
      console.error('Authorization failed:', authError);
      throw new Error(`Authorization failed: ${authError instanceof Error ? authError.message : String(authError)}`);
    }

    return client;
  } catch (error) {
    console.error('Failed to create Google auth client:', error);
    throw new Error(`Google auth failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};