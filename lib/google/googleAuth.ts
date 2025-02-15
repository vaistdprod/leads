import { google } from 'googleapis';
import { getEnvOrThrow } from '@/lib/env/validateEnv';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/admin.directory.user.readonly',
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
      // Use provided user for impersonation, fallback to admin
      subject: impersonatedUser || defaultUser,
    });

    try {
      console.log('Authorizing client for:', impersonatedUser || defaultUser);
      await client.authorize();
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

export const getUserInfo = async (email: string) => {
  try {
    // Create admin client for directory access
    const adminAuth = await getGoogleAuthClient();
    const admin = google.admin({ version: 'directory_v1', auth: adminAuth });
    
    console.log('Fetching user info for:', email);
    const { data: user } = await admin.users.get({ 
      userKey: email,
      projection: 'full',
      viewType: 'domain_public'
    });

    return {
      name: user.name?.fullName || user.primaryEmail?.split('@')[0],
      email: user.primaryEmail,
      photoUrl: user.thumbnailPhotoUrl,
    };
  } catch (error) {
    console.error('Failed to get user info:', error);
    // Return basic info if directory access fails
    return {
      name: email.split('@')[0].split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' '),
      email: email,
      photoUrl: null,
    };
  }
};