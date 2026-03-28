import { z } from "zod";

const serverEnvSchema = z.object({
  GOOGLE_PLACES_API_KEY: z.string().min(1, "GOOGLE_PLACES_API_KEY is required"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  ENRICHMENT_USER_AGENT: z.string().min(1).default("SynttekLeadsEngineBot/1.0"),
  CRON_SECRET: z.string().optional(),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ENRICHMENT_USER_AGENT: process.env.ENRICHMENT_USER_AGENT,
    CRON_SECRET: process.env.CRON_SECRET,
  });
}
