import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  GOOGLE_CLIENT_ID: z.string().optional(), // Optional for now, but warn if missing
  GOOGLE_CLIENT_SECRET: z.string().optional(), // Optional for now, but warn if missing
  GOOGLE_REDIRECT_URI: z.string().url().optional(), // Optional for now, but warn if missing
  GEMINI_API_KEY: z.string().optional(), // Optional for now, but warn if missing
  DISIFY_API_KEY: z.string().optional(), // Optional for now, but warn if missing
  SUPABASE_JWT_SECRET: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  // Add other required environment variables here
});

let validatedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (!validatedEnv) {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
      console.error(
        "❌ Invalid environment variables:",
        result.error.flatten().fieldErrors,
      );
      throw new Error("Invalid environment variables. See above for details.");
    }

    validatedEnv = result.data;

    // Warn if optional, but recommended, variables are missing
    if (!validatedEnv.GOOGLE_CLIENT_ID) console.warn("⚠️ GOOGLE_CLIENT_ID is not set. Google integration will not work.");
    if (!validatedEnv.GOOGLE_CLIENT_SECRET) console.warn("⚠️ GOOGLE_CLIENT_SECRET is not set. Google integration will not work.");
    if (!validatedEnv.GOOGLE_REDIRECT_URI) console.warn("⚠️ GOOGLE_REDIRECT_URI is not set. Google integration will not work.");
    if (!validatedEnv.GEMINI_API_KEY) console.warn("⚠️ GEMINI_API_KEY is not set. AI features will not work.");
    if (!validatedEnv.DISIFY_API_KEY) console.warn("⚠️ DISIFY_API_KEY is not set. Email verification will not work.");
    if (!validatedEnv.SUPABASE_JWT_SECRET) console.warn("⚠️ SUPABASE_JWT_SECRET is not set. JWT verification might not work as expected.");
    if (!validatedEnv.SUPABASE_SERVICE_ROLE_KEY) console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. Server-side operations might be limited.");

    console.log("✅ Environment variables are valid.");
  }

  return validatedEnv;
}
