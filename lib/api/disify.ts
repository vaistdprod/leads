export async function verifyEmail(email: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.disify.com/v4/email/${encodeURIComponent(email)}`
    );
    
    if (!response.ok) {
      console.error('Disify API error:', response.statusText);
      // If API fails, we'll assume email is valid rather than blocking the process
      return true;
    }

    const data = await response.json();
    console.log('Disify response for', email, ':', data);

    // Consider email valid unless explicitly marked as invalid/disposable/spam
    return !(data.disposable === true || data.spam === true || data.format === false);
  } catch (error) {
    console.error('Email verification failed:', error);
    // On error, assume email is valid rather than blocking the process
    return true;
  }
}