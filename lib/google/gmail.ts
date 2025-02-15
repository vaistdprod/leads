import { google } from 'googleapis';
import { getGoogleAuthClient } from './googleAuth';

async function getUserInfo(impersonatedEmail: string) {
  try {
    // Use admin client to get user info
    const adminAuth = await getGoogleAuthClient();
    const admin = google.admin({ version: 'directory_v1', auth: adminAuth });

    const { data: user } = await admin.users.get({
      userKey: impersonatedEmail,
      projection: 'full',
    });

    return {
      email: user.primaryEmail,
      name: user.name?.fullName || user.name?.givenName || user.primaryEmail?.split('@')[0],
      photoUrl: user.thumbnailPhotoUrl,
    };
  } catch (error) {
    console.error('Failed to get user info:', error);
    // Fallback to basic info from email
    return {
      email: impersonatedEmail,
      name: impersonatedEmail.split('@')[0].split('.').map(
        part => part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' '),
      photoUrl: null,
    };
  }
}

export async function sendEmail(to: string, subject: string, body: string, impersonatedEmail?: string) {
  try {
    if (!impersonatedEmail) {
      throw new Error('Impersonated email is required');
    }

    console.log('Sending email to:', to, 'as:', impersonatedEmail);
    
    // Get user info first
    const userInfo = await getUserInfo(impersonatedEmail);
    console.log('User info:', userInfo);

    // Get Gmail client for sending
    const auth = await getGoogleAuthClient(impersonatedEmail);
    const gmail = google.gmail({ version: 'v1', auth });

    // Format the email in MIME format
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: "${userInfo.name}" <${userInfo.email}>`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      body.replace('[Vaše jméno]', userInfo.name),
    ];
    const message = messageParts.join('\n');

    // Encode the message
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('Sending email via Gmail API...');
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('Email sent successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
  }
}