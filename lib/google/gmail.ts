import { google } from 'googleapis';
import { getGoogleAuthClient } from './googleAuth';

export async function sendEmail(to: string, subject: string, body: string, impersonatedEmail?: string) {
  try {
    console.log('Sending email to:', to, 'as:', impersonatedEmail);
    const auth = await getGoogleAuthClient(impersonatedEmail);
    const gmail = google.gmail({ version: 'v1', auth });

    // Format sender name from email
    const senderName = impersonatedEmail ? 
      impersonatedEmail.split('@')[0].split('.').map(
        part => part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ') : 
      'System';

    // Format the email in MIME format
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: "${senderName}" <${impersonatedEmail}>`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      body.replace('[Vaše jméno]', senderName),
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