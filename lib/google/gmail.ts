import { isDevelopment } from '@/lib/env';

export async function sendEmail(to: string, subject: string, body: string) {
  // In development mode, just log the email
  if (isDevelopment) {
    console.log('Development mode: Mock email sent', {
      to,
      subject,
      body
    });
    return;
  }

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        body,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
