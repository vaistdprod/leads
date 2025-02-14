import { google } from 'googleapis';
import { getGoogleAuthClient } from './googleAuth';

export async function sendEmail(to: string, subject: string, body: string) {
  try {
    console.log('Sending email to:', to);
    const auth = await getGoogleAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    // Get user profile to get sender name
    const { data: profile } = await google.oauth2('v2').userinfo.get({ auth });
    const senderName = profile.name || 'Lead Processing System';
    const senderEmail = process.env.GOOGLE_DELEGATED_USER;

    if (!senderEmail) {
      throw new Error('GOOGLE_DELEGATED_USER environment variable is not set');
    }

    // Format the email in MIME format with sender name
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: "${senderName}" <${senderEmail}>`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      body,
    ];
    const message = messageParts.join('\n');

    // Encode the message in base64url format
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