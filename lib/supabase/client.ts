import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../types';
import { getEnv } from '../env';

// Create a singleton instance for the browser
let supabase: ReturnType<typeof createBrowserClient<Database>>;

export function createBrowserSupabaseClient() {
  try {
    const env = getEnv();
    return createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
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

// Mock data for development mode
export const mockData = {
  settings: {
    gemini_api_key: 'mock-api-key',
    model: 'gemini-pro',
    temperature: 0.7,
    top_k: 40,
    top_p: 0.95,
    use_google_search: false,
    enrichment_prompt: 'Default enrichment prompt',
    email_prompt: 'Default email prompt',
    blacklist_sheet_id: 'mock-blacklist-id',
    contacts_sheet_id: 'mock-contacts-id',
    auto_execution_enabled: false,
    cron_schedule: '0 0 * * *',
  },
  analytics: {
    apiUsage: [
      { date: '2025-01-01', gemini: 150, gmail: 75, sheets: 30, disify: 45 },
      { date: '2025-01-02', gemini: 180, gmail: 90, sheets: 35, disify: 50 },
      { date: '2025-01-03', gemini: 120, gmail: 60, sheets: 25, disify: 40 },
    ],
    successRates: [
      { date: '2025-01-01', success: 85, failure: 15 },
      { date: '2025-01-02', success: 90, failure: 10 },
      { date: '2025-01-03', success: 88, failure: 12 },
    ],
  },
  history: {
    emailHistory: [],
    leadHistory: [],
  },
};

// Helper for simulating network delays in development
export const simulateDelay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));