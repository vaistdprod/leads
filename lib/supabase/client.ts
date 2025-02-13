'use client';

import { createBrowserClient } from '@supabase/ssr';

// Create a singleton instance for the browser
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('createBrowserSupabaseClient can only be called in the browser');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1];
        },
        set(name: string, value: string, options: { path?: string; domain?: string; maxAge?: number }) {
          let cookie = `${name}=${value}`;
          if (options.path) cookie += `; path=${options.path}`;
          if (options.domain) cookie += `; domain=${options.domain}`;
          if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
          cookie += `; secure; SameSite=Lax`;
          document.cookie = cookie;
        },
        remove(name: string, options: { path?: string; domain?: string }) {
          let cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          if (options.path) cookie += `; path=${options.path}`;
          if (options.domain) cookie += `; domain=${options.domain}`;
          cookie += `; secure; SameSite=Lax`;
          document.cookie = cookie;
        },
      },
    }
  );
}

// Initialize the client lazily only when needed
function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient can only be called in the browser');
  }

  if (!supabaseInstance) {
    supabaseInstance = createBrowserSupabaseClient();
  }

  return supabaseInstance;
}

// Create a proxy to handle lazy initialization
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(target, prop) {
    const client = getSupabaseClient();
    const value = client[prop as keyof typeof client];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
