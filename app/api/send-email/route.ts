import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuthClient } from '@/lib/google/googleAuth';

export async function POST(request: Request) {
try {
// Expect impersonatedEmail to be passed in the request body along with to, subject, and body.
const { to, subject, body, impersonatedEmail } = await request.json();

// Format the subject in UTF-8 (Base64 encoded)
const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
const messageParts = [
  'From: "Lead Processing System" <your-email@yourdomain.com>', // update sender email if needed
  `To: ${to}`,
  `Subject: ${utf8Subject}`,
  'MIME-Version: 1.0',
  'Content-Type: text/html; charset=utf-8',
  '',
  body,
];
const message = messageParts.join('\n');
const encodedMessage = Buffer.from(message)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

// Use the impersonatedEmail from the request (or default from env in googleAuth)
const auth = await getGoogleAuthClient(impersonatedEmail);
const gmail = google.gmail({ version: 'v1', auth });

await gmail.users.messages.send({
  userId: 'me', // 'me' means that Gmail uses the impersonated account from our JWT client.
  requestBody: { raw: encodedMessage },
});

return NextResponse.json({ success: true });
} catch (error) {
console.error('Failed to send email:', error);
return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
}
}