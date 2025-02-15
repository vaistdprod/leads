import { google } from 'googleapis';
import { getGoogleAuthClient, getUserInfo } from './googleAuth';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  impersonatedEmail?: string;
}

export async function sendEmail({ to, subject, body, impersonatedEmail }: EmailOptions) {
  try {
    if (!impersonatedEmail) {
      throw new Error('Impersonated email is required');
    }

    console.log('Sending email to:', to, 'as:', impersonatedEmail);
    
    // First, get the sender's info from Directory API
    const senderInfo = await getUserInfo(impersonatedEmail);
    console.log('Sender info:', senderInfo);

    // Create auth client for sending as impersonated user
    const auth = await getGoogleAuthClient(impersonatedEmail);
    const gmail = google.gmail({ version: 'v1', auth });

    // Format the email headers with proper sender info
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: "${senderInfo.name}" <${senderInfo.email}>`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      // Update signature in the body with the sender's name
      body.replace('[Vaše jméno]', senderInfo.name),
    ];
    const message = messageParts.join('\n');

    // Encode the message
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email
    console.log('Sending email via Gmail API as:', senderInfo.name, `<${senderInfo.email}>`);
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