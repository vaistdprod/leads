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
      viewType: 'domain_public',
    });

    // Check if the photo URL is a placeholder
    const isPlaceholderPhoto = !user.thumbnailPhotoUrl || 
      user.thumbnailPhotoUrl.includes('ALV-') || 
      user.thumbnailPhotoUrl.includes('AAAAA');

    return {
      email: user.primaryEmail,
      name: user.name?.fullName || user.name?.givenName || user.primaryEmail?.split('@')[0],
      photoUrl: isPlaceholderPhoto ? null : user.thumbnailPhotoUrl,
    };
  } catch (error) {
    console.error('Failed to get user info:', error);
    // Fallback to basic info from email
    const name = impersonatedEmail.split('@')[0].split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    
    return {
      email: impersonatedEmail,
      name,
      photoUrl: null,
    };
  }
}

// Rest of the file remains the same...


function encodeHeader(text: string): string {
  // Convert to Base64 with UTF-8 encoding
  const base64 = Buffer.from(text, 'utf8').toString('base64');
  return `=?UTF-8?B?${base64}?=`;
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

    // Encode headers properly
    const encodedSubject = encodeHeader(subject);
    const encodedName = encodeHeader(userInfo.name);

    // Format the email in MIME format with proper encoding
    const messageParts = [
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      `From: ${encodedName} <${userInfo.email}>`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      '',
    ];

    // Add profile image if available
    let htmlBody = body;
    if (userInfo.photoUrl) {
      htmlBody = htmlBody.replace('</body>', `
        <img src="${userInfo.photoUrl}" alt="${userInfo.name}" style="width: 48px; height: 48px; border-radius: 50%; margin-top: 16px;">
        </body>
      `);
    }

    // Replace name placeholder and encode body
    htmlBody = htmlBody.replace('[Vaše jméno]', userInfo.name);
    const encodedBody = Buffer.from(htmlBody, 'utf8').toString('base64');
    messageParts.push(encodedBody);

    // Join message parts and encode for Gmail API
    const message = messageParts.join('\r\n');
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