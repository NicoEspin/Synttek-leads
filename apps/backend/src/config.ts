import { z } from "zod";

const serverConfigSchema = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_CORS_ORIGINS: z.string().min(1).default("http://localhost:3000"),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(120),
});

export type ServerConfig = {
  port: number;
  corsOrigins: string[];
  isCorsOriginAllowed: (origin: string) => boolean;
  rateLimitWindowMs: number;
  rateLimitMax: number;
};

function parseOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function toOriginMatcher(pattern: string) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  const regex = new RegExp(`^${escaped}$`);
  return (origin: string) => regex.test(origin);
}

export function getServerConfig(): ServerConfig {
  const env = serverConfigSchema.parse({
    API_PORT: process.env.API_PORT,
    API_CORS_ORIGINS: process.env.API_CORS_ORIGINS,
    API_RATE_LIMIT_WINDOW_MS: process.env.API_RATE_LIMIT_WINDOW_MS,
    API_RATE_LIMIT_MAX: process.env.API_RATE_LIMIT_MAX,
  });

  const corsOrigins = parseOrigins(env.API_CORS_ORIGINS);
  if (corsOrigins.length === 0) {
    throw new Error("API_CORS_ORIGINS must include at least one origin");
  }

  const originMatchers = corsOrigins.map(toOriginMatcher);

  return {
    port: env.API_PORT,
    corsOrigins,
    isCorsOriginAllowed: (origin: string) => originMatchers.some((matches) => matches(origin)),
    rateLimitWindowMs: env.API_RATE_LIMIT_WINDOW_MS,
    rateLimitMax: env.API_RATE_LIMIT_MAX,
  };
}
