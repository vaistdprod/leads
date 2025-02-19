import { trackApiUsage } from './tracking';

export async function verifyEmail(email: string): Promise<boolean> {
  const startTime = Date.now();
  let status = 200;

  try {
    const response = await fetch(
      `https://disify.com/api/email/${encodeURIComponent(email)}`
    );
    
    status = response.status;
    
    if (!response.ok) {
      console.error('Disify API error:', response.statusText);
      
      await trackApiUsage('disify', 'verifyEmail', status, Date.now() - startTime, {
        success: false,
        error: response.statusText,
        email
      });
      
      // If API fails, assume email is valid
      return true;
    }

    const data = await response.json();
    console.log('Disify response for', email, ':', data);

    // Disify API is unreliable for format checks, so we'll do a basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);

    // Only consider disposable and spam flags from Disify
    const isValid = isValidFormat && !(data.disposable === true || data.spam === true);

    await trackApiUsage('disify', 'verifyEmail', status, Date.now() - startTime, {
      success: true,
      email,
      isValid,
      disposable: data.disposable,
      spam: data.spam
    });

    return isValid;
  } catch (error) {
    status = 500;
    console.error('Email verification failed:', error);
    
    await trackApiUsage('disify', 'verifyEmail', status, Date.now() - startTime, {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      email
    });
    
    // On error, assume email is valid
    return true;
  }
}
