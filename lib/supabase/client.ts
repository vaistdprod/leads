import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../types'
import { getEnv } from '../env';

export function createBrowserSupabaseClient() {
  const env = getEnv();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Create a singleton instance for the browser
export const supabase = createBrowserSupabaseClient()
