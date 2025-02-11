import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_LEAD_SUPABASE_URL: z.string().default('http://localhost:54321'),
  NEXT_PUBLIC_LEAD_SUPABASE_ANON_KEY: z.string().default('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  LEAD_SUPABASE_JWT_SECRET: z.string().optional(),
  LEAD_SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

let validatedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (!validatedEnv) {
    const envToValidate = {
      NEXT_PUBLIC_LEAD_SUPABASE_URL: process.env.NEXT_PUBLIC_LEAD_SUPABASE_URL,
      NEXT_PUBLIC_LEAD_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_LEAD_SUPABASE_ANON_KEY,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LEAD_SUPABASE_JWT_SECRET: process.env.LEAD_SUPABASE_JWT_SECRET,
      LEAD_SUPABASE_SERVICE_ROLE_KEY: process.env.LEAD_SUPABASE_SERVICE_ROLE_KEY,
    };

    const result = envSchema.safeParse(envToValidate);

    if (!result.success) {
      console.error(
        "❌ Invalid environment variables:",
        result.error.flatten().fieldErrors,
      );
      
      // In development, use default values
      if (process.env.NODE_ENV === 'development') {
        validatedEnv = envSchema.parse({});
        console.log("⚠️ Using development defaults for environment variables");
      } else {
        throw new Error("Invalid environment variables");
      }
    } else {
      validatedEnv = result.data;
    }

    // Warn if optional variables are missing
    if (!validatedEnv.GOOGLE_CLIENT_ID) console.warn("⚠️ GOOGLE_CLIENT_ID is not set. Google integration will not work.");
    if (!validatedEnv.GOOGLE_CLIENT_SECRET) console.warn("⚠️ GOOGLE_CLIENT_SECRET is not set. Google integration will not work.");
    if (!validatedEnv.GOOGLE_REDIRECT_URI) console.warn("⚠️ GOOGLE_REDIRECT_URI is not set. Google integration will not work.");
    if (!validatedEnv.GEMINI_API_KEY) console.warn("⚠️ GEMINI_API_KEY is not set. AI features will not work.");
    if (!validatedEnv.LEAD_SUPABASE_JWT_SECRET) console.warn("⚠️ LEAD_SUPABASE_JWT_SECRET is not set. JWT verification might not work as expected.");
    if (!validatedEnv.LEAD_SUPABASE_SERVICE_ROLE_KEY) console.warn("⚠️ LEAD_SUPABASE_SERVICE_ROLE_KEY is not set. Server-side operations might be limited.");

    console.log("✅ Environment variables are valid.");
  }

  return validatedEnv;
}