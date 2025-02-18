import { google } from 'googleapis';
import { getEnvOrThrow } from '@/lib/env/validateEnv';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/admin.directory.user.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
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

    // Create JWT client with admin user for directory access
    const adminClient = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: SCOPES,
      subject: defaultUser, // Always use admin for directory access
    });

    // If we need to impersonate a different user for sending email
    if (impersonatedUser && impersonatedUser !== defaultUser) {
      const userClient = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: [
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/spreadsheets'
        ],
        subject: impersonatedUser,
      });

      // Test authorization for the impersonated user
      try {
        await userClient.authorize();
        console.log('Authorization successful for:', impersonatedUser);
        return userClient;
      } catch (authError) {
        console.error('Authorization failed for impersonated user:', authError);
        throw new Error(`Authorization failed for ${impersonatedUser}: ${authError instanceof Error ? authError.message : String(authError)}`);
      }
    }

    // Test authorization for admin client
    try {
      await adminClient.authorize();
      console.log('Authorization successful for admin:', defaultUser);
    } catch (authError) {
      console.error('Authorization failed for admin:', authError);
      throw new Error(`Authorization failed: ${authError instanceof Error ? authError.message : String(authError)}`);
    }

    return adminClient;
  } catch (error) {
    console.error('Failed to create Google auth client:', error);
    throw new Error(`Google auth failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
