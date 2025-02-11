import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../types'
import { getEnv, isDevelopment } from '../env';

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
    if (isDevelopment) {
      return createBrowserClient<Database>(
        'http://localhost:54321',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      )
    }
    throw error; // Re-throw in non-development environments
  }
}

// Initialize the client
if (!supabase) {
  supabase = createBrowserSupabaseClient();
}

export { supabase };

// Helper for simulating network delays in development
export const simulateDelay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));
