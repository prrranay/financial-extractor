import { z } from "zod";

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required for analysis extraction"),
});

/**
 * Validates and retrieves verified environment variables at runtime.
 * Safely handles build-time checks so Next.js static builds do not crash if keys are omitted.
 */
export function getEnv() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error("❌ Environment validation failed:", result.error.format());
    throw new Error(
      "Missing GEMINI_API_KEY environment variable. Please make sure to configure GEMINI_API_KEY in your .env.local file."
    );
  }
  
  return result.data;
}
