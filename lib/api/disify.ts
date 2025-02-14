export async function verifyEmail(email: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://disify.com/api/email/${encodeURIComponent(email)}`
    );
    
    if (!response.ok) {
      console.error('Disify API error:', response.statusText);
      // If API fails, assume email is valid
      return true;
    }

    const data = await response.json();
    console.log('Disify response for', email, ':', data);

    // Disify API is unreliable for format checks, so we'll do a basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);

    // Only consider disposable and spam flags from Disify
    return isValidFormat && !(data.disposable === true || data.spam === true);
  } catch (error) {
    console.error('Email verification failed:', error);
    // On error, assume email is valid
    return true;
  }
}