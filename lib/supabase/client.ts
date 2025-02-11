import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../types'
import { getEnv, isDevelopment } from '../env';

// Create a singleton instance for the browser
let supabase: ReturnType<typeof createBrowserClient<Database>>;

// Development mode helpers
export const getMockData = async (data: any) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { data };
};

export const createMockSession = () => ({
  user: {
    id: 'dev-user-id',
    email: 'dev@example.com',
    role: 'authenticated',
  },
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600000,
});

export const isDevAuthenticated = () => {
  if (!isDevelopment) return false;
  return true;
};

export function createBrowserSupabaseClient() {
  try {
    const env = getEnv();
    return createBrowserClient<Database>(
      env.NEXT_PUBLIC_LEAD_SUPABASE_URL,
      env.NEXT_PUBLIC_LEAD_SUPABASE_ANON_KEY
    )
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw error;
  }
}

// Initialize the client
if (!supabase) {
  supabase = createBrowserSupabaseClient();
}

export { supabase, isDevelopment };