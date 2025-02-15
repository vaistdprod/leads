import { google } from 'googleapis';
import { getGoogleAuthClient } from './googleAuth';

export async function sendEmail(to: string, subject: string, body: string, impersonatedEmail?: string) {
  try {
    console.log('Sending email to:', to, 'as:', impersonatedEmail || 'default user');
    const auth = await getGoogleAuthClient(impersonatedEmail);
    const gmail = google.gmail({ version: 'v1', auth });

    // Format the email in MIME format
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `Content-Type: text/html; charset=utf-8`,
      `MIME-Version: 1.0`,
      `Content-Transfer-Encoding: 7bit`,
      `to: ${to}`,
      `subject: ${utf8Subject}`,
      ``,
      body,
    ];
    const message = messageParts.join('\n');

    // Encode the message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('Sending email via Gmail API as:', impersonatedEmail || 'default user');
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