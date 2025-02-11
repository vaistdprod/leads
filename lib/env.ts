import { z } from 'zod';

export const isDevelopment = process.env.NODE_ENV === 'development';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'), // Use .url() for URL validation
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

let validatedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (!validatedEnv) {
    const defaultValues = {
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    };

    const envToValidate = {
      ...process.env,
      ...(isDevelopment && {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || defaultValues.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultValues.NEXT_PUBLIC_SUPABASE_ANON_KEY
      })
    };

    // Log the raw values *before* Zod validation.
    console.log("NEXT_PUBLIC_SUPABASE_URL (raw):", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY (raw):", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    try {
      validatedEnv = envSchema.parse(envToValidate);
      console.log("✅ Environment variables are valid:", validatedEnv);
    } catch (error) {
      console.error('❌ Invalid environment variables:', error);
      throw new Error('Invalid environment variables. See console for details.');
    }


    // Warn if optional variables are missing
    if (!validatedEnv.GOOGLE_CLIENT_ID) console.warn("⚠️ GOOGLE_CLIENT_ID is not set");
    if (!validatedEnv.GOOGLE_CLIENT_SECRET) console.warn("⚠️ GOOGLE_CLIENT_SECRET is not set");
    if (!validatedEnv.GOOGLE_REDIRECT_URI) console.warn("⚠️ GOOGLE_REDIRECT_URI is not set");
    if (!validatedEnv.GEMINI_API_KEY) console.warn("⚠️ GEMINI_API_KEY is not set");
    if (!validatedEnv.SUPABASE_JWT_SECRET) console.warn("⚠️ SUPABASE_JWT_SECRET is not set");
    if (!validatedEnv.SUPABASE_SERVICE_ROLE_KEY) console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return validatedEnv;
}

// Development mode helpers
export function createMockSession() {
  if (!isDevelopment) return null;
  
  return {
    user: {
      id: 'dev-user-id',
      email: 'dev@example.com',
      role: 'authenticated',
    },
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 3600000,
  };
}

export function setDevAuth() {
  if (!isDevelopment) return false;

  const mockSession = createMockSession();
  if (!mockSession) return false;

  try {
    // Set both localStorage and cookie
    localStorage.setItem('dev_auth', 'true');
    localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession));
    
    document.cookie = `dev_auth=true; path=/; max-age=86400; samesite=lax`;
    document.cookie = `sb-dev-auth-token=${JSON.stringify(mockSession)}; path=/; max-age=86400; samesite=lax`;

    return true;
  } catch (error) {
    console.error('Failed to set dev auth:', error);
    return false;
  }
}

export function isDevAuthenticated() {
  if (!isDevelopment) return false;
  
  try {
    const localAuth = localStorage.getItem('dev_auth') === 'true';
    const localToken = localStorage.getItem('supabase.auth.token');
    const cookieAuth = document.cookie.includes('dev_auth=true');
    const cookieToken = document.cookie.includes('sb-dev-auth-token=');

    return localAuth && localToken && cookieAuth && cookieToken;
  } catch (error) {
    console.error('Failed to check dev auth:', error);
    return false;
  }
}
