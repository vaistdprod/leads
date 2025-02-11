export async function verifyEmail(email: string): Promise<boolean> {
      try {
        const apiKey = process.env.DISIFY_API_KEY;
        if (!apiKey) {
          console.error('Disify API key is missing!');
          return false;
        }

        const response = await fetch(
          `https://api.disify.com/v4/email/${encodeURIComponent(email)}`,
          {
            headers: {
              'x-api-key': apiKey,
            },
          }
        );
        const data = await response.json();

        return data.valid && !data.disposable && !data.spam;
      } catch (error) {
        console.error('Email verification failed:', error);
        return false;
      }
    }
