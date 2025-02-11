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
    // Return a mock client for development
    if (process.env.NODE_ENV === 'development') {
      return createBrowserClient<Database>(
        'http://localhost:54321',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      )
    }
    throw error;
  }
}

// Initialize the client
if (!supabase) {
  supabase = createBrowserSupabaseClient();
}

export { supabase };

// Helper for development mode
export const isDevelopment = process.env.NODE_ENV === 'development';

// Mock data helper
export const getMockData = async (data: any) => {
  await simulateDelay(500);
  return { data };
};

// Simulate delay helper
export const simulateDelay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// Development mode auth helper
export const setDevAuth = async () => {
  if (!isDevelopment) return null;

  try {
    // Create mock session
    const mockSession = {
      user: {
        id: 'dev-user-id',
        email: 'dev@example.com',
        role: 'authenticated',
      },
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600000,
    };

    // Set both localStorage and cookie
    localStorage.setItem('dev_auth', 'true');
    localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession));
    
    // Set cookie with proper attributes
    document.cookie = `dev_auth=true; path=/; max-age=86400; samesite=lax; domain=${window.location.hostname}`;
    document.cookie = `sb-dev-auth-token=${JSON.stringify(mockSession)}; path=/; max-age=86400; samesite=lax; domain=${window.location.hostname}`;

    // Force a small delay to ensure cookies are set
    await simulateDelay(100);

    return mockSession;
  } catch (error) {
    console.error('Failed to set dev auth:', error);
    return null;
  }
};

// Clear development mode auth
export const clearDevAuth = () => {
  if (!isDevelopment) return;

  try {
    // Clear localStorage
    localStorage.removeItem('dev_auth');
    localStorage.removeItem('supabase.auth.token');
    
    // Clear cookies
    const cookies = ['dev_auth', 'sb-dev-auth-token'];
    const domains = [window.location.hostname, ''];
    
    for (const cookie of cookies) {
      for (const domain of domains) {
        document.cookie = `${cookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=lax${domain ? `; domain=${domain}` : ''}`;
      }
    }
  } catch (error) {
    console.error('Failed to clear dev auth:', error);
  }
};

// Check if user is authenticated in development mode
export const isDevAuthenticated = () => {
  if (!isDevelopment) return false;
  
  try {
    // Check localStorage
    const localAuth = localStorage.getItem('dev_auth') === 'true';
    const localToken = localStorage.getItem('supabase.auth.token');
    
    // Check cookies
    const cookieAuth = document.cookie.split(';').some(c => c.trim().startsWith('dev_auth=true'));
    const cookieToken = document.cookie.split(';').some(c => c.trim().startsWith('sb-dev-auth-token='));

    // All auth methods must be present
    return localAuth && localToken && cookieAuth && cookieToken;
  } catch (error) {
    console.error('Failed to check dev auth:', error);
    return false;
  }
};