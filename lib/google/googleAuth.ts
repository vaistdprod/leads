import { google } from 'googleapis';
import { getEnvOrThrow } from '@/lib/env/validateEnv';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/admin.directory.user.readonly',
  'openid',
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
      // Always use the admin account for initial authentication
      subject: defaultUser,
    });

    // Test authorization
    try {
      console.log('Authorizing client for:', impersonatedUser || defaultUser);
      const credentials = await client.authorize();

      // If we're impersonating a user, set up domain-wide delegation
      if (impersonatedUser && impersonatedUser !== defaultUser) {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
          access_token: credentials.access_token,
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        await gmail.users.settings.sendAs.list({
          userId: 'me',
        });

        // Update the client to use the impersonated user
        client.subject = impersonatedUser;
        await client.authorize();
      }

      console.log('Authorization successful:', {
        accessToken: credentials.access_token ? 'Present' : 'Missing',
        expiryDate: credentials.expiry_date,
        impersonatedUser: client.subject,
      });
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