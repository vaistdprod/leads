import { z } from 'zod';

export const isDevelopment = process.env.NODE_ENV === 'development';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, 'Supabase URL is required'),
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
    // In development, use default values if environment variables are not set
    const envToValidate = {
      ...process.env,
      ...(isDevelopment && {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      })
    };

    const result = envSchema.safeParse(envToValidate);

    if (!result.success) {
      console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
      
      if (!isDevelopment) {
        throw new Error('Required environment variables are missing');
      }
    }

    validatedEnv = result.success ? result.data : envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    });

    // Warn if optional variables are missing
    if (!validatedEnv.GOOGLE_CLIENT_ID) console.warn("⚠️ GOOGLE_CLIENT_ID is not set. Google integration will not work.");
    if (!validatedEnv.GOOGLE_CLIENT_SECRET) console.warn("⚠️ GOOGLE_CLIENT_SECRET is not set. Google integration will not work.");
    if (!validatedEnv.GOOGLE_REDIRECT_URI) console.warn("⚠️ GOOGLE_REDIRECT_URI is not set. Google integration will not work.");
    if (!validatedEnv.GEMINI_API_KEY) console.warn("⚠️ GEMINI_API_KEY is not set. AI features will not work.");
    if (!validatedEnv.SUPABASE_JWT_SECRET) console.warn("⚠️ SUPABASE_JWT_SECRET is not set. JWT verification might not work as expected.");
    if (!validatedEnv.SUPABASE_SERVICE_ROLE_KEY) console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. Server-side operations might be limited.");

    if (result.success) {
      console.log("✅ Environment variables are valid.");
    } else if (isDevelopment) {
      console.log("⚠️ Using development defaults for environment variables.");
    }
  }

  return validatedEnv;
}

// Helper function to create mock session for development
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