'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../types';
import { getEnv } from '../env';

let supabase: ReturnType<typeof createBrowserClient<Database>>;

export function createBrowserSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('createBrowserSupabaseClient can only be called in the browser');
  }

  try {
    const env = getEnv();
    return createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            const cookie = document.cookie
              .split('; ')
              .find((row) => row.startsWith(`${name}=`));
            return cookie ? cookie.split('=')[1] : undefined;
          },
          set(name: string, value: string, options: { path?: string; domain?: string; sameSite?: string; secure?: boolean }) {
            document.cookie = `${name}=${value}; path=${options.path || '/'}; secure; SameSite=Lax`;
          },
          remove(name: string, options: { path?: string; domain?: string }) {
            document.cookie = `${name}=; path=${options.path || '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          },
        },
      }
    );
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw error;
  }
}

// Initialize the client lazily only on the client side
if (typeof window !== 'undefined' && !supabase) {
  supabase = createBrowserSupabaseClient();
}

export { supabase };