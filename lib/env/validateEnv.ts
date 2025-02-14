export function getEnvOrThrow(envVar: string): string {
    const value = process.env[envVar];
    if (!value) {
      throw new Error(`Missing environment variable: ${envVar}`);
    }
    return value;
  }