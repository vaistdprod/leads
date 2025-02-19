import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function trackApiUsage(service: string, endpoint: string, status: number, duration: number, details?: any) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => {
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        set: (name, value, options) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error('Error setting cookie:', error);
          }
        },
        remove: (name, options) => {
          try {
            cookieStore.delete(name);
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
        },
      },
    }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found for API tracking');
      return;
    }

    await supabase.from('api_usage').insert({
      user_id: user.id,
      service,
      endpoint,
      status,
      duration,
      details
    });
  } catch (error) {
    console.error('Failed to track API usage:', error);
  }
}
