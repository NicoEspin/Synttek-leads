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

type OriginMatcher = (origin: string) => boolean;

function normalizeConfiguredOrigin(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  return trimmed;
}

function normalizeExactOrigin(value: string): string {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Unsupported CORS origin protocol: ${value}`);
  }

  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`CORS origins must not include paths, query params, or fragments: ${value}`);
  }

  return `${url.protocol}//${url.host.toLowerCase()}`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

function buildWildcardOriginMatcher(pattern: string): OriginMatcher {
  const wildcardMatch = pattern.match(/^(https?):\/\/([^/?#]+)\/?$/i);

  if (!wildcardMatch) {
    throw new Error(`Invalid CORS origin pattern: ${pattern}`);
  }

  const [, protocol, hostPattern] = wildcardMatch;

  if (!hostPattern.includes("*")) {
    throw new Error(`Wildcard CORS origin pattern must include '*': ${pattern}`);
  }

  if (hostPattern === "*") {
    throw new Error("Wildcard CORS origin pattern cannot match every host");
  }

  const hostRegex = new RegExp(`^${escapeRegex(hostPattern.toLowerCase()).replace(/\*/g, "[^.]*")}$`);
  const normalizedProtocol = `${protocol.toLowerCase()}:`;

  return (origin: string) => {
    try {
      const url = new URL(origin);

      if (url.protocol !== normalizedProtocol) {
        return false;
      }

      return hostRegex.test(url.host.toLowerCase());
    } catch {
      return false;
    }
  };
}

export function parseOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map(normalizeConfiguredOrigin)
    .filter(Boolean);
}

export function toOriginMatcher(pattern: string): OriginMatcher {
  if (pattern.includes("*")) {
    return buildWildcardOriginMatcher(pattern);
  }

  const normalizedPattern = normalizeExactOrigin(pattern);
  return (origin: string) => {
    try {
      return normalizeExactOrigin(origin) === normalizedPattern;
    } catch {
      return false;
    }
  };
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
