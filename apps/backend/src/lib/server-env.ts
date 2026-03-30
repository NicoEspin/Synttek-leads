import { z } from "zod";

export class MissingEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingEnvError";
  }
}

const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
});

const placesEnvSchema = z.object({
  GOOGLE_PLACES_API_KEY: z.string().min(1, "GOOGLE_PLACES_API_KEY is required"),
});

const enrichmentEnvSchema = z.object({
  ENRICHMENT_USER_AGENT: z.string().min(1).default("SynttekLeadsEngineBot/1.0"),
});

const optionalServerEnvSchema = z.object({
  CRON_SECRET: z.string().optional(),
});

export function getSupabaseEnv() {
  return supabaseEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

export function getPlacesEnv() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new MissingEnvError(
      "Missing Google Places API key. Set GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY) in backend env vars.",
    );
  }

  return placesEnvSchema.parse({
    GOOGLE_PLACES_API_KEY: apiKey,
  });
}

export function getEnrichmentEnv() {
  return enrichmentEnvSchema.parse({
    ENRICHMENT_USER_AGENT: process.env.ENRICHMENT_USER_AGENT,
  });
}

export function getOptionalServerEnv() {
  return optionalServerEnvSchema.parse({
    CRON_SECRET: process.env.CRON_SECRET,
  });
}
