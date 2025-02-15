import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuthClient } from '@/lib/google/googleAuth';

export async function POST(request: Request) {
  try {
    // Expect impersonatedEmail to be passed in the request body along with to, subject, and body.
    const { to, subject, body, impersonatedEmail } = await request.json();

    // Get the Gmail client with impersonation
    const auth = await getGoogleAuthClient(impersonatedEmail);
    const gmail = google.gmail({ version: 'v1', auth });

    // Get sender info
    const { data: profile } = await gmail.users.getProfile({ userId: 'me' });
    const actualSenderEmail = profile.emailAddress;
    const displayName = actualSenderEmail?.split('@')[0].split('.').map(
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
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}