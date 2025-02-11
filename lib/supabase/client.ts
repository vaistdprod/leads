import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../types'
import { getEnv } from '../env';

// Create a singleton instance for the browser
let supabase: ReturnType<typeof createBrowserClient<Database>>;

export function createBrowserSupabaseClient() {
  try {
    const env = getEnv();
    return createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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

export { supabase };

// Mock data helper for development
export const getMockData = async (data: any) => {
  await simulateDelay(500);
  return { data };
};

// Simulate delay helper
export const simulateDelay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));