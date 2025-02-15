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
    console.log('Sending email to:', to, 'as:', impersonatedEmail || 'default user');
    const auth = await getGoogleAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    // Get sender info from Directory API
    const senderInfo = await getUserInfo(auth, impersonatedEmail || '');
    
    // Create a new JWT client for sending as the impersonated user
    const sendingAuth = await getGoogleAuthClient(impersonatedEmail);
    const sendingGmail = google.gmail({ version: 'v1', auth: sendingAuth });

    // Format the subject in UTF-8 (Base64 encoded)
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    
    const messageParts = [
      `From: "${senderInfo.name}" <${senderInfo.email}>`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      // Update signature in the body with the correct name
      body.replace('[Vaše jméno]', senderInfo.name),
    ];
    const message = messageParts.join('\n');

    // Encode the message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('Sending email via Gmail API as:', senderInfo.name, `<${senderInfo.email}>`);
    const result = await sendingGmail.users.messages.send({
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