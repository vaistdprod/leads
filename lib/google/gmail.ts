import { google } from 'googleapis';
import { getGoogleAuthClient } from './googleAuth';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  impersonatedEmail?: string;
  senderName?: string;
}

export async function sendEmail({ to, subject, body, impersonatedEmail, senderName }: EmailOptions) {
  try {
    console.log('Sending email to:', to, 'as:', impersonatedEmail || 'default user');
    const auth = await getGoogleAuthClient(impersonatedEmail);
    const gmail = google.gmail({ version: 'v1', auth });

    // Get sender info
    const { data: profile } = await gmail.users.getProfile({ userId: 'me' });
    const actualSenderEmail = profile.emailAddress;

    // Get user info to get the proper display name
    const { data: userInfo } = await gmail.users.getProfile({
      userId: 'me',
    });

    // Use the sender name from settings, or try to get it from Gmail profile
    const displayName = senderName || userInfo.emailAddress?.split('@')[0].split('.').map(
      part => part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');

    // Format the subject in UTF-8 (Base64 encoded)
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: "${displayName}" <${actualSenderEmail}>`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      // Update signature in the body with the correct name
      body.replace('[Vaše jméno]', displayName),
    ];
    const message = messageParts.join('\n');

    // Encode the message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('Sending email via Gmail API as:', displayName, `<${actualSenderEmail}>`);
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