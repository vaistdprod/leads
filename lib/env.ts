import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, 'Supabase URL is required'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  NEXT_PUBLIC_APP_URL: z.string().min(1, 'App URL is required'),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(1, 'Google client ID is required'),
});

let validatedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (!validatedEnv) {
    const envToValidate = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    };

    try {
      validatedEnv = envSchema.parse(envToValidate);
    } catch (error) {
      console.error('Environment validation failed:', error);
      throw error;
    }
  }

  return validatedEnv;
}